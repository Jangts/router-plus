import { createMemoryStateAdapter } from '../dist/esm/core/state.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterPlus } from '../dist/esm/index.js';
import { createMemoryConnection } from '../dist/esm/testing/index.js';
import { createReactRoutes } from '../dist/esm/react/index.js';
import { createVueRoutes, createVueRouterPlus } from '../dist/esm/vue/index.js';
import { installHistoryBridge } from '../dist/esm/dom/index.js';
import { createRouter, createMemoryHistory } from 'vue-router';
const pages = [{id:'a',path:'/a',title:'A',retain:true,state:{initial:{value:0}}},{id:'b',path:'/b',title:'B',state:{initial:{value:10}}}];
function setup(options={}) { const plus=createRouterPlus({pages,globalKey:false,...options}); const connection=createMemoryConnection({initial:{pathname:'/a'}});plus.connect(connection);return {plus,connection}; }

test('nested generators attach child records to the returned parent',()=>{
 const definitions=[{id:'p',path:'/p',title:'P'},{id:'c',path:'/p/c',title:'C',parentId:'p'}];
 for(const generate of [createReactRoutes,createVueRoutes]) assert.equal(generate(definitions)[0].children[0].name,'c');
});
test('bridge fallback patches read inside the serial queue',async()=>{
 const {plus}=setup();let value={a:0,b:0};plus.registerStateBridge('x',{read:()=>value,write:async(next)=>{value=next;}});
 await Promise.all([plus.patchState({a:1},'x'),plus.patchState({b:1},'x')]);assert.deepEqual(value,{a:1,b:1});await plus.dispose();
});
test('retained scope reads, writes, targets and events stay bound after navigation',async()=>{
 const {plus}=setup(), a=plus.scope();let finish;const wait=new Promise(r=>finish=r);let value=0;
 a.registerStateBridge('slow',{read:()=>value,write:async v=>{await wait;value=v;}});
 const events=[];plus.subscribe(e=>{if(e.type==='state')events.push(e.context.pageId);});
 const write=a.setState(1,'slow');await Promise.resolve();await plus.navigate('/b');finish();await write;
 assert.deepEqual(events,['a']);assert.equal(a.getContext().pageId,'a');await a.setState({value:3});assert.deepEqual(plus.getState(),{value:10});assert.deepEqual(a.getState(),{value:3});await plus.dispose();
});
test('release invalidates pending registrations without resurrecting their state',async()=>{
 const {plus}=setup(), old=plus.scope();let finish;const wait=new Promise(r=>finish=r);let value=0;
 old.registerStateBridge('x',{read:()=>value,write:async v=>{await wait;value=v;}});
 const task=old.setState(5,'x');await Promise.resolve();await plus.release();finish();assert.equal((await task).ok,false);
 assert.equal((await old.setState(7)).reason,'cancelled');assert.deepEqual(plus.getState(),{value:0});await plus.dispose();
});
test('owned storage adapter is used and SSR snapshots restore state',async()=>{
 const adapter=createMemoryStateAdapter();const {plus}=setup({state:adapter});await plus.setState({value:42});assert.ok(Object.keys(adapter.snapshot()).length);
 const snapshot=await plus.snapshot();const hydrated=createRouterPlus({pages,globalKey:false,initialSnapshot:snapshot});assert.deepEqual(hydrated.getState(),{value:42});await plus.dispose();await hydrated.dispose();
});
test('unregistered bridge snapshot can be restored before mount',async()=>{
 const {plus}=setup();let value=5;plus.registerStateBridge('x',{read:()=>value,snapshot:async()=>value});const snapshot=await plus.snapshot();
 const restored=createRouterPlus({pages,globalKey:false,initialSnapshot:snapshot});let next=0;restored.registerStateBridge('x',{read:()=>next,restore:async v=>{next=v;}});
 restored.registerHost({});await new Promise(r=>setTimeout(r,10));assert.equal(next,5);await restored.dispose();await plus.dispose();
});
test('all subscribers share history observation and can detach independently',async()=>{
 const {plus:a}=setup(),{plus:b}=setup();const win={location:{pathname:'/a',search:'',hash:''},history:{pushState(data,_x,url){this.state=data;win.location.pathname=url;},replaceState(){}},addEventListener(){},removeEventListener(){}};
 const da=installHistoryBridge(a,win),db=installHistoryBridge(b,win);win.history.pushState({},'','/b');assert.equal(a.getContext().path,'/b');assert.equal(b.getContext().path,'/b');da();win.history.pushState({},'','/a');assert.equal(b.getContext().path,'/a');db();await a.dispose();await b.dispose();
});
test('clear and committed navigation cancel unresolved highlights',async()=>{
 for(const action of ['clear','navigate']) {const {plus}=setup();let resolve;await plus.use({id:'late',setup(api){api.registerTargetResolver('late',{resolve:()=>new Promise(r=>resolve=r)});}});
 const pending=plus.highlight({target:'late',value:null});if(action==='clear')await plus.clearHighlight();else await plus.navigate('/b');resolve({});assert.equal((await pending).reason,'cancelled');assert.equal(plus.getHighlight(),null);await plus.dispose();}
});
test('real Vue Router preserves navigation failure and native guards',async()=>{
 const router=createRouter({history:createMemoryHistory(),routes:pages.map(p=>({path:p.path,component:{}}))});await router.push('/a');
 const plus=createRouterPlus({pages,globalKey:false});const plugin=createVueRouterPlus({plus,router});plugin.install({use(){},provide(){},config:{globalProperties:{}}});
 const stop=router.beforeEach(()=>false);const failed=await plus.navigate('/b');assert.equal(failed.ok,false);assert.equal(plus.getContext().path,'/a');stop();
 plus.registerGuard({id:'native',beforeLeave:()=>false});await router.push('/b');assert.equal(router.currentRoute.value.path,'/a');assert.equal(plus.getContext().path,'/a');plugin.disconnect();await plus.dispose();
});

test('serial navigation queues all concurrent requests and traversal checks leave guards',async()=>{
 const {plus}=setup({navigationStrategy:'serial'});const events=[];plus.subscribe(e=>{if(e.type==='navigation')events.push(e.to.path);});
 await Promise.all([plus.navigate('/b'),plus.navigate('/a'),plus.navigate('/b')]);assert.deepEqual(events,['/b','/a','/b']);
 plus.registerGuard({id:'leave',beforeLeave:()=>false});assert.equal((await plus.back()).reason,'blocked');assert.equal(plus.getContext().path,'/b');await plus.dispose();
});
test('custom matching and registered route transforms are consumed',async()=>{
 const {plus}=setup({matcher:{match:(template,path)=>template==='/a'&&path==='/alias'?{params:{}}:template===path?{params:{}}:null,build:(template)=>template}});
 assert.equal(plus.match('/alias').page.id,'a');await plus.use({id:'routes',setup(api){api.registerRouteTransformer({id:'extra',transform:routes=>[...routes,{path:'/extra'}]});}});
 assert.equal(createReactRoutes(pages,{plus}).at(-1).path,'/extra');assert.equal(createVueRoutes(pages,{plus}).at(-1).path,'/extra');await plus.dispose();
});
test('registered renderer executes and async plugin cleanup is awaited',async()=>{
 const {plus}=setup();const calls=[];await plus.use({id:'renderer',setup(api){api.registerHighlightRenderer({mount:()=>calls.push('mount'),render:s=>calls.push(s?'highlight':'clear'),destroy:()=>calls.push('destroy')},{});return async()=>{await Promise.resolve();calls.push('cleanup');};}});
 await plus.highlight({element:{}});await plus.unuse('renderer');assert.deepEqual(calls,['mount','clear','highlight','cleanup','destroy']);await plus.dispose();
});
test('session reset, version migration and diagnostics use explicit persistence rules',async()=>{
 const data=new Map();Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
 const definitions=[{path:'/a',title:'A',state:{initial:{v:0},persist:'session',version:1}}];const {plus}=setup({pages:definitions});await plus.setState({v:4});await plus.resetState();assert.deepEqual(plus.getState(),{v:0});await plus.setState({v:8});await plus.dispose();
 const hydrated=createRouterPlus({pages:[{...definitions[0],state:{...definitions[0].state,version:2,migrate:value=>({v:value.v+1})}}],initialLocation:{pathname:'/a',search:'',hash:''},globalKey:false});assert.deepEqual(hydrated.getState(),{v:9});await hydrated.dispose();delete globalThis.sessionStorage;
});

test('native directory ranking and Unicode parameters match in both frameworks',async()=>{
 const definitions=[{id:'dynamic',path:'/:id',title:'Dynamic'},{id:'fixed',path:'/fixed',title:'Fixed'}];
 const {reactMatcher}=await import('../dist/esm/react/matcher.js');const {vueMatcher}=await import('../dist/esm/vue/matcher.js');
 for(const matcher of [reactMatcher,vueMatcher]){const plus=createRouterPlus({pages:definitions,matcher,globalKey:false});assert.equal(plus.match('/fixed').page.id,'fixed');assert.equal(plus.match('/%E4%B8%AD%E6%96%87').params.id,'中文');assert.equal(plus.resolveHref({page:'dynamic',params:{id:'中文'}}),'/%E4%B8%AD%E6%96%87');await plus.dispose();}
});
test('nested aliases remain generated and owned adapter subscriptions publish external changes',async()=>{
 const definitions=[{id:'p',path:'/p',title:'P',pathAliases:['/q']},{id:'c',path:'/p/c',title:'C',parentId:'p'}];const routes=createReactRoutes(definitions);assert.equal(routes[1].children[0].path,'/q/c');
 const adapter=createMemoryStateAdapter(),{plus}=setup({state:adapter});plus.getState();const key=Object.keys(adapter.snapshot())[0];const events=[];plus.subscribe(e=>{if(e.type==='state')events.push(e.value);});adapter.set(key,{version:0,value:{value:91}});assert.deepEqual(plus.getState(),{value:91});assert.deepEqual(events,[{value:91}]);await plus.dispose();
});

test('late receipts preserve committed facts without reverting a newer address',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let listener,release;const gate=new Promise(r=>release=r);let entered;const enteredPromise=new Promise(r=>entered=r);
 plus.connect({initial:{pathname:'/a',search:'',hash:''},subscribe(fn){listener=fn;return()=>{};},async commit(request){const location={pathname:request.path,search:'',hash:'',state:request.state,navigationId:request.navigationId,entryKey:request.navigationId};listener({location,source:'plus',navigationId:request.navigationId});if(request.path==='/b'){entered();await gate;}return{status:'committed',location};}});
 const old=plus.navigate('/b');await enteredPromise;await plus.navigate('/a');release();const result=await old;assert.equal(result.committed,true);assert.equal(plus.getContext().pathname,'/a');await plus.dispose();
});

test('a renderer that fails initial rendering rolls back its mount and registration',async()=>{
 const {plus}=setup();let destroyed=false;await assert.rejects(plus.use({id:'bad-renderer',setup(api){api.registerHighlightRenderer({mount(){},render(){throw Error('render');},destroy(){destroyed=true;}},{});}}));assert.equal(destroyed,true);assert.equal(plus.hasCustomRenderer,false);await plus.dispose();
});

test('hidden scope navigation runs origin guards and reports the origin context',async()=>{
 const seen=[];let block=false;
 const definitions=[{id:'origin',path:'/alpha/:id',title:'Alpha',retain:true,tabs:[{id:'one'},{id:'two'}],guards:{beforeLeave:({context})=>{seen.push(['page',context.pathname]);return !block;}}},{path:'/beta',title:'Beta',guards:{beforeLeave:()=>{seen.push(['active']);return false;}}},{path:'/gamma',title:'Gamma'}];
 const plus=createRouterPlus({pages:definitions,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/alpha/1'}}));
 const origin=plus.scope();origin.registerGuard({id:'local',beforeLeave:context=>{seen.push(['scope',context.pathname]);return true;}});
 await plus.navigate('/beta');seen.length=0;block=true;
 assert.equal((await origin.navigate('/gamma')).reason,'blocked');assert.equal(plus.getContext().pathname,'/beta');assert.deepEqual(seen,[['scope','/alpha/1'],['page','/alpha/1']]);
 block=false;seen.length=0;let event;plus.subscribe(e=>{if(e.type==='navigation')event=e;});
 assert.equal((await origin.replace('/gamma')).ok,true);assert.equal(event.from.pathname,'/alpha/1');assert.deepEqual(seen,[['scope','/alpha/1'],['page','/alpha/1']]);
 await plus.navigate('/beta');seen.length=0;assert.equal((await origin.execute({kind:'tab.set',tab:'two'})).ok,true);assert.equal(plus.getContext().pathname,'/alpha/1');assert.equal(plus.getTab(),'two');assert.deepEqual(seen,[['scope','/alpha/1'],['page','/alpha/1']]);
 await plus.dispose();
});
