import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<div id="app"></div>', { url: 'https://app.test/' });
for (const key of ['window','document','HTMLElement','Element','SVGElement','Node','MutationObserver','history','location'])
  Object.defineProperty(globalThis,key,{value:dom.window[key], configurable:true});
const Vue = await import('vue');
const {createRouter, createMemoryHistory} = await import('vue-router');
const {createVueRouterPlus, useRpRef, useRpReactiveState} = await import('../dist/esm/vue/index.js');
const settle = async plus => { await Vue.nextTick(); await new Promise(r=>setTimeout(r,0)); await plus.whenReady(); await Vue.nextTick(); };
const qs = f => new URL(f.router.options.history.location, 'https://app.test').searchParams;
async function mount(url, setup, fields) {
 const router = createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:{render:()=>null}},{path:'/b',component:{render:()=>null}}]});
 await router.push(url); await router.isReady();
 const plugin = createVueRouterPlus({router,pages:[{path:'/a',states:fields},{path:'/b'}],globalKey:false});
 let state;
 const app=Vue.createApp({setup(){state=setup();return()=>Vue.h('div');}});
 app.use(plugin);app.mount(document.getElementById('app')); await settle(plugin.plus);
 return {router,plus:plugin.plus,state,async close(){app.unmount();await plugin.plus.dispose();}};
}

test('catalog binding by ID retains its codec/query contract without repeated configuration',async()=>{
 const f=await mount('/a?tab=products&keep=yes#anchor',()=>useRpRef('overview','tab'),{tab:{default:'overview',query:true,values:['overview','products']}});
 try { assert.equal(f.state.value,'products'); f.state.value='overview'; await settle(f.plus);assert.equal(qs(f).get('tab'),'overview');assert.equal(f.router.currentRoute.value.hash,'#anchor');assert.equal(qs(f).get('keep'),'yes'); }
 finally { await f.close(); }
});

test('pending catalog preserves URL across another binding update and restores latest navigation',async()=>{
 const ready=Vue.ref(false); const allowed=Vue.ref([]);
 const f=await mount('/a?tab=products&term=old',()=>({tab:useRpRef('overview',{id:'tab',query:true,ready:()=>ready.value,validate:v=>allowed.value.includes(v)}),term:useRpRef('',{id:'term',query:true})}));
 try {
  assert.equal(f.state.tab.value,'overview');f.state.term.value='new';await settle(f.plus);
  assert.equal(qs(f).get('tab'),'products');
  assert.equal((await f.plus.setState('products','tab')).reason,'not-ready');
  await f.router.replace('/a?tab=references&term=new');await settle(f.plus);
  allowed.value=['overview','products','references'];ready.value=true;await settle(f.plus);
  assert.equal(f.state.tab.value,'references');assert.equal(f.state.term.value,'new');
 } finally {await f.close();}
});

test('native edits during loading take precedence over the old pending address',async()=>{
 const ready=Vue.ref(false);
 const f=await mount('/a?tab=products',()=>useRpRef('overview',{id:'tab',query:true,ready:()=>ready.value,values:['overview','products','references']}));
 try {f.state.value='references';await settle(f.plus);assert.equal(qs(f).get('tab'),'products');ready.value=true;await settle(f.plus);assert.equal(f.state.value,'references');assert.equal(qs(f).get('tab'),'references');}
 finally {await f.close();}
});

test('ready cancellation on unmount cannot rewrite an address',async()=>{
 const ready=Vue.ref(false);
 const f=await mount('/a?tab=products',()=>useRpRef('overview',{id:'tab',query:true,ready:()=>ready.value}));
 await f.close();ready.value=true;await Vue.nextTick();assert.equal(qs(f).get('tab'),'products');
});

test('push bindings traverse history while default replace bindings retain unrelated URL parts',async()=>{
 const f=await mount('/a?tab=overview&keep=yes#anchor',()=>useRpRef('overview',{id:'tab',query:true,history:'push',values:['overview','products']}));
 try {
  f.state.value='products';await settle(f.plus);assert.equal(qs(f).get('tab'),'products');
  const changed=new Promise(resolve=>{const stop=f.router.afterEach(()=>{stop();resolve();});});f.router.back();await changed;await settle(f.plus);
  assert.equal(f.state.value,'overview');assert.equal(qs(f).get('keep'),'yes');assert.equal(f.router.currentRoute.value.hash,'#anchor');
 } finally {await f.close();}
});

test('omission preserves empty, false and zero semantics and restores group defaults',async()=>{
 const f=await mount('/a?keep=yes#anchor',()=>useRpReactiveState({term:'',page:1,enabled:false,tags:[]},{id:'filters',query:true,omitDefault:true}));
 try {
  f.state.page=0;f.state.enabled=true;await settle(f.plus);assert.equal(qs(f).get('page'),'0');assert.equal(qs(f).get('enabled'),'true');
  f.state.page=1;f.state.enabled=false;await settle(f.plus);assert.deepEqual(Object.fromEntries(qs(f)),{keep:'yes'});
  await f.router.replace('/a?tags=%5B%22x%22%5D&page=2&keep=yes#anchor');await settle(f.plus);assert.deepEqual([...f.state.tags],['x']);assert.equal(f.state.page,2);
  await f.router.replace('/a?keep=yes#anchor');await settle(f.plus);assert.deepEqual([...f.state.tags],[]);assert.equal(f.state.page,1);assert.equal(f.state.enabled,false);
 } finally {await f.close();}
});

test('catalog-only readiness is observed and validator changes revalidate the address',async()=>{
 const ready=Vue.ref(false),allowed=Vue.ref(['overview','products']);
 const f=await mount('/a?tab=products',()=>useRpRef('overview','tab'),{tab:{default:'overview',query:true,ready:()=>ready.value,validate:v=>allowed.value.includes(v)}});
 try{
  assert.equal(f.state.value,'overview');ready.value=true;await settle(f.plus);assert.equal(f.state.value,'products');
  allowed.value=['overview'];await settle(f.plus);assert.equal(f.state.value,'overview');
  allowed.value=['overview','products'];await settle(f.plus);assert.equal(f.state.value,'products');
 }finally{await f.close();}
});

test('same-turn native bindings commit one atomic push without an intermediate entry',async()=>{
 const f=await mount('/a?tab=overview&term=old',()=>({tab:useRpRef('overview',{id:'tab',query:true,history:'push'}),term:useRpRef('',{id:'term',query:true})}));
 try{
  let commits=0;const stop=f.router.afterEach(()=>commits++);
  f.state.tab.value='products';f.state.term.value='new';await settle(f.plus);stop();assert.equal(commits,1);
  assert.equal(qs(f).get('tab'),'products');assert.equal(qs(f).get('term'),'new');
  const changed=new Promise(resolve=>{const off=f.router.afterEach(()=>{off();resolve();});});f.router.back();await changed;await settle(f.plus);
  assert.equal(f.state.tab.value,'overview');assert.equal(f.state.term.value,'old');
 }finally{await f.close();}
});

test('a rejected native update restores the committed address without an App watcher',async()=>{
 const f=await mount('/a?tab=overview',()=>useRpRef('overview',{id:'tab',query:true}));
 try{
  const stop=f.plus.registerGuard({id:'deny-tab',beforeLeave:()=>false});
  f.state.value='products';await settle(f.plus);assert.equal(qs(f).get('tab'),'overview');assert.equal(f.state.value,'overview');stop();
 }finally{await f.close();}
});

test('unrelated address edits do not discard a pending native choice',async()=>{
 const ready=Vue.ref(false);
 const f=await mount('/a?tab=products&term=old',()=>({tab:useRpRef('overview',{id:'tab',query:true,ready:()=>ready.value}),term:useRpRef('',{id:'term',query:true})}));
 try{
  f.state.tab.value='references';await settle(f.plus);f.state.term.value='new';await settle(f.plus);
  ready.value=true;await settle(f.plus);assert.equal(f.state.tab.value,'references');assert.equal(qs(f).get('tab'),'references');assert.equal(qs(f).get('term'),'new');
 }finally{await f.close();}
});

test('catalog-dependent codecs are not evaluated before readiness',async()=>{
 const ready=Vue.ref(false);let premature=0;
 const requireCatalog=()=>{if(!ready.value){premature++;throw new Error('catalog unavailable');}};
 const f=await mount('/a?version=v2',()=>useRpRef('initial',{id:'version',query:true,ready:()=>ready.value,encode:value=>{requireCatalog();return value==='ref-2'?'v2':'default';},decode:raw=>{requireCatalog();return raw==='v2'?'ref-2':'initial';}}));
 try{assert.equal(premature,0);ready.value=true;await settle(f.plus);assert.equal(f.state.value,'ref-2');assert.equal(premature,0);}
 finally{await f.close();}
});

test('malformed new policies fail before any native state is subscribed',async()=>{
 const {createRouterPlus}=await import('../dist/esm/index.js');
 for(const rule of [{history:'append'},{ready:true},{omitDefault:'yes'}])
  assert.throws(()=>createRouterPlus({pages:[{path:'/a',states:{x:{default:'',...rule}}}],globalKey:false}),/State/);
});

test('Vue functional query edits share the receipt and preserve repeated values',async()=>{
 const {usePageQuery}=await import('../dist/esm/vue/index.js');
 const f=await mount('/a?keep=yes#anchor',()=>usePageQuery());
 try{
  const first=f.state.setQuery(q=>{q.append('tags','one');return q;},{replace:true});
  const second=f.state.setQuery(q=>{q.append('tags','two');return q;},{replace:true});
  assert.equal((await first).ok,true);assert.equal((await second).ok,true);await settle(f.plus);
  assert.deepEqual(qs(f).getAll('tags'),['one','two']);assert.equal(qs(f).get('keep'),'yes');
  await f.state.setQuery({tags:['three','four']},{replace:true});await settle(f.plus);assert.deepEqual(qs(f).getAll('tags'),['three','four']);
 }finally{await f.close();}
});

test('Vue cached outlets preserve native DOM and rebuild it after explicit release',async()=>{
 const {RouterPlusView}=await import('../dist/esm/vue/index.js');const {useRoute}=await import('vue-router');
 const Page={setup(){const route=useRoute();return()=>Vue.h('input',{'data-route':route.path});}};
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:Page},{path:'/b',component:Page}]});await router.push('/a');await router.isReady();
 const plus=createVueRouterPlus({router,pages:[{path:'/a',retain:true},{path:'/b',retain:true}],globalKey:false});
 const app=Vue.createApp({render:()=>Vue.h(RouterPlusView)});app.use(plus);app.mount(document.getElementById('app'));await settle(plus);
 try{
  const original=document.querySelector('[data-route="/a"]');assert.ok(original);original.value='keep';
  await plus.navigate('/b');await settle(plus);await plus.navigate('/a');await settle(plus);assert.equal(document.querySelector('[data-route="/a"]'),original);assert.equal(original.value,'keep');
  await plus.release();await settle(plus);assert.notEqual(document.querySelector('[data-route="/a"]'),original);
 }finally{app.unmount();await plus.dispose();}
});

test('group omission honors a field explicitly retaining its default',async()=>{
 const f=await mount('/a?term=x&page=2',()=>useRpReactiveState({term:'',page:1},{id:'filters',query:true,omitDefault:true,fields:{page:{omitDefault:false}}}));
 try{f.state.term='';f.state.page=1;await settle(f.plus);assert.equal(qs(f).has('term'),false);assert.equal(qs(f).get('page'),'1');}
 finally{await f.close();}
});

test('public state and tab commands return guard failure receipts',async()=>{
 const {useRouterPlus}=await import('../dist/esm/vue/index.js');
 const f=await mount('/a?tab=overview',()=>({tab:useRpRef('overview',{id:'tab',query:true}),commands:useRouterPlus()}));
 try{const stop=f.plus.registerGuard({id:'deny',beforeLeave:()=>false});const result=await f.state.commands.setState('products','tab');assert.equal(result?.ok,false);assert.equal(result?.reason,'blocked');assert.equal((await f.state.commands.setTab('products'))?.ok,false);stop();}
 finally{await f.close();}
});

test('queued query inputs are captured when submitted',async()=>{
 const {usePageQuery}=await import('../dist/esm/vue/index.js');
 const f=await mount('/a',()=>usePageQuery());
 try{const input=new URLSearchParams('term=first');const done=f.state.setQuery(input);input.set('term','later');await done;await settle(f.plus);assert.equal(qs(f).get('term'),'first');}
 finally{await f.close();}
});

test('overlapping state writes settle to the latest values while a guard is waiting',async()=>{
 const f=await mount('/a?tab=overview&term=old',()=>({tab:useRpRef('overview',{id:'tab',query:true}),term:useRpRef('',{id:'term',query:true})}));
 try{
  let unlock,entered;const seen=new Promise(r=>entered=r);let calls=0;
  const stop=f.plus.registerGuard({id:'slow',beforeLeave:()=>{if(++calls===1){entered();return new Promise(r=>unlock=r);}return true;}});
  f.state.tab.value='products';await seen;f.state.term.value='new';await Vue.nextTick();unlock(true);await settle(f.plus);stop();
  assert.equal(qs(f).get('tab'),'products');assert.equal(qs(f).get('term'),'new');assert.equal(f.state.tab.value,'products');assert.equal(f.state.term.value,'new');
 }finally{await f.close();}
});

test('cached Vue outlets survive navigation to a route with no matched component',async()=>{
 const {RouterPlusView}=await import('../dist/esm/vue/index.js');
 const Page={render:()=>Vue.h('input',{'data-cached-empty':'a'})};
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:Page},{path:'/empty'}]});await router.push('/a');
 const plus=createVueRouterPlus({router,pages:[{path:'/a',retain:true},{path:'/empty'}],globalKey:false});
 const app=Vue.createApp({render:()=>Vue.h(RouterPlusView)});app.use(plus);app.mount(document.getElementById('app'));await settle(plus);
 try{const original=document.querySelector('[data-cached-empty]');original.value='keep';await plus.navigate('/empty');await settle(plus);await plus.navigate('/a');await settle(plus);assert.equal(document.querySelector('[data-cached-empty]'),original);assert.equal(original.value,'keep');}
 finally{app.unmount();await plus.dispose();}
});


test('invalid native selections recover the committed value',async()=>{
 const f=await mount('/a?tab=products',()=>useRpRef('overview',{id:'tab',query:true,values:['overview','products']}));
 try{f.state.value='illegal';await settle(f.plus);assert.equal(f.state.value,'products');assert.equal(qs(f).get('tab'),'products');}
 finally{await f.close();}
});

test('a throwing query updater resolves a failed receipt without modifying the URL',async()=>{
 const {usePageQuery}=await import('../dist/esm/vue/index.js');const f=await mount('/a?keep=yes',()=>usePageQuery());
 try{const result=await f.state.setQuery(()=>{throw new Error('invalid edit');});assert.equal(result.ok,false);assert.equal(result.reason,'failed');assert.equal(qs(f).get('keep'),'yes');}
 finally{await f.close();}
});

test('retained dynamic instances keep independent readiness and codec contracts',async()=>{
 const {RouterPlusView}=await import('../dist/esm/vue/index.js');const {useRoute}=await import('vue-router');
 const loaded={one:Vue.ref(false),two:Vue.ref(false)},states={};
 const Page={setup(){const id=useRoute().params.id;states[id]=useRpRef('overview',{id:'tab',query:true,ready:()=>loaded[id].value});return()=>Vue.h('span');}};
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/item/:id',component:Page}]});await router.push('/item/one?tab=products');
 const plus=createVueRouterPlus({router,pages:[{path:'/item/:id',retain:true}],globalKey:false});
 const app=Vue.createApp({render:()=>Vue.h(RouterPlusView)});app.use(plus);app.mount(document.getElementById('app'));await settle(plus);
 try{await plus.navigate('/item/two?tab=references');await settle(plus);loaded.one.value=true;await settle(plus);await plus.navigate('/item/one?tab=products');await settle(plus);assert.equal(states.one.value,'products');assert.equal(states.two.value,'overview');}
 finally{app.unmount();await plus.dispose();}
});

test('static catalog defaults do not inherit another mounted instance validator',async()=>{
 const {RouterPlusView}=await import('../dist/esm/vue/index.js');const {useRoute}=await import('vue-router');let selected;
 const Page={setup(){const id=useRoute().params.id;const value=useRpRef('overview',{id:'tab',query:true,ready:()=>true,validate:v=>v==='overview'||v===id});if(id==='two')selected=value;return()=>Vue.h('span');}};
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/item/:id',component:Page}]});await router.push('/item/one?tab=one');
 const plus=createVueRouterPlus({router,pages:[{path:'/item/:id',retain:true,states:{tab:{default:'overview',query:true}}}],globalKey:false});const app=Vue.createApp({render:()=>Vue.h(RouterPlusView)});app.use(plus);app.mount(document.getElementById('app'));await settle(plus);
 try{const result=await plus.navigate('/item/two?tab=two');assert.equal(result.ok,true);await settle(plus);assert.equal(selected.value,'two');}
 finally{app.unmount();await plus.dispose();}
});

test('functional query edits preserve earlier proposals while a guard waits',async()=>{
 const {usePageQuery}=await import('../dist/esm/vue/index.js');const f=await mount('/a?keep=yes',()=>usePageQuery());
 try{let unlock,entered;const seen=new Promise(r=>entered=r);let calls=0;const stop=f.plus.registerGuard({id:'slow-query',beforeLeave:()=>{if(++calls===1){entered();return new Promise(r=>unlock=r);}return true;}});
 const first=f.state.setQuery(q=>{q.set('one','1');return q;});await seen;
 const second=f.state.setQuery(q=>{q.set('two','2');return q;});unlock(true);await Promise.all([first,second]);await settle(f.plus);stop();assert.equal(qs(f).get('one'),'1');assert.equal(qs(f).get('two'),'2');assert.equal(qs(f).get('keep'),'yes');
 }finally{await f.close();}
});

test('local-only native edits during loading do not discard pending address fields',async()=>{
 const ready=Vue.ref(false);const f=await mount('/a?tab=products',()=>useRpReactiveState({tab:'overview',expanded:false},{id:'filters',fields:{tab:{query:true}},ready:()=>ready.value}));
 try{f.state.expanded=true;ready.value=true;await settle(f.plus);assert.equal(f.state.tab,'products');assert.equal(f.state.expanded,true);assert.equal(qs(f).get('tab'),'products');}
 finally{await f.close();}
});

test('async query updater input is rejected without clearing existing parameters',async()=>{
 const {usePageQuery}=await import('../dist/esm/vue/index.js');const f=await mount('/a?keep=yes',()=>usePageQuery());
 try{const result=await f.state.setQuery(async q=>q);assert.equal(result.ok,false);assert.equal(result.reason,'failed');assert.equal(qs(f).get('keep'),'yes');}
 finally{await f.close();}
});

test('custom date codecs and default omission retain changed dates',async()=>{
 const date=new Date('2026-01-01T00:00:00Z');const f=await mount('/a',()=>useRpRef(date,{id:'date',query:true,omitDefault:true,encode:d=>d.toISOString(),decode:q=>new Date(q.get('date')??date.toISOString())}));
 try{f.state.value=new Date('2026-02-01T00:00:00Z');await settle(f.plus);assert.equal(qs(f).get('date'),'2026-02-01T00:00:00.000Z');assert.equal(f.state.value.toISOString(),'2026-02-01T00:00:00.000Z');f.state.value=new Date(date);await settle(f.plus);assert.equal(qs(f).has('date'),false);}
 finally{await f.close();}
});

test('custom Map codecs do not conflate changed values with an empty default',async()=>{
 const f=await mount('/a',()=>useRpRef(new Map(),{id:'selection',query:'selected',omitDefault:true,encode:m=>JSON.stringify([...m]),decode:q=>new Map(JSON.parse(q.get('selected')??'[]'))}));
 try{f.state.value.set('one',1);await settle(f.plus);assert.equal(qs(f).get('selected'),'[["one",1]]');f.state.value.clear();await settle(f.plus);assert.equal(qs(f).has('selected'),false);}
 finally{await f.close();}
});


test('an atomic object codec receives only its owned parameter collection',async()=>{
 const f=await mount('/a?filter=%7B%22term%22%3A%22hello%22%7D',()=>useRpRef({term:''},{id:'filter',query:'filter',encode:v=>JSON.stringify(v),decode:q=>JSON.parse(q.get('filter')??'{"term":""}')}));
 try{assert.equal(f.state.value.term,'hello');f.state.value.term='next';await settle(f.plus);assert.deepEqual(JSON.parse(qs(f).get('filter')),{term:'next'});}
 finally{await f.close();}
});
