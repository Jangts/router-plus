import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<div id="app"></div>',{url:'https://app.test/'});
for(const key of ['window','document','HTMLElement','Element','SVGElement','Node','MutationObserver','history','location'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
const Vue=await import('vue'),{createRouter,createMemoryHistory}=await import('vue-router');
const {createVueRouterPlus,useRpRef}=await import('../dist/esm/vue/index.js');
const tick=()=>new Promise(r=>setTimeout(r,0));
async function mount(setup,url='/a?tab=products'){
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:{render:()=>null}}]});await router.push(url);let value;
 const plus=createVueRouterPlus({router,pages:[{path:'/a'}],globalKey:false});const app=Vue.createApp({setup(){value=setup();return()=>Vue.h('span');}});app.use(plus);app.mount(document.getElementById('app'));await tick();await plus.whenReady();return{plus,router,get value(){return value;},async close(){app.unmount();await plus.dispose();}};
}
test('live validation dependencies revalidate without a placeholder readiness predicate',async()=>{
 const allowed=Vue.ref(['overview','products']);const f=await mount(()=>useRpRef('overview',{id:'tab',query:true,validate:value=>allowed.value.includes(value)}));
 try{assert.equal(f.value.value,'products');allowed.value=['overview'];await tick();assert.equal(f.value.value,'overview');allowed.value=['overview','products'];await tick();assert.equal(f.value.value,'products');}
 finally{await f.close();}
});
test('live codecs remap a valid address without a placeholder readiness predicate',async()=>{
 const catalog=Vue.ref({initial:'default',one:'v2'});const f=await mount(()=>useRpRef('initial',{id:'version',query:true,encode:value=>catalog.value[value],decode:raw=>Object.entries(catalog.value).find(([,label])=>label===raw)?.[0]??'initial'}),'/a?version=v2');
 try{assert.equal(f.value.value,'one');catalog.value={initial:'default',two:'v2'};await tick();assert.equal(f.value.value,'two');}
 finally{await f.close();}
});
test('partial query is available through core, scope, global facade and commands',async()=>{
 const {createRouterPlus,toGlobalFacade}=await import('../dist/esm/index.js');const {createMemoryConnection}=await import('../dist/esm/testing/index.js');
 const plus=createRouterPlus({pages:[{path:'/a',retain:true}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?keep=yes',hash:'#part'}}));
 try{await plus.patchQuery({a:'one'});await plus.scope().patchQuery({b:['two','three']});await toGlobalFacade(plus).patchQuery({a:undefined});assert.equal((await plus.execute({kind:'query.patch',patch:{c:''}})).ok,true);const query=new URLSearchParams(plus.getContext().search);assert.deepEqual(query.getAll('b'),['two','three']);assert.equal(query.get('keep'),'yes');assert.equal(query.get('c'),'');assert.equal(query.has('a'),false);assert.equal(plus.getContext().hash,'#part');await plus.dispose();assert.equal((await plus.patchQuery({})).reason,'cancelled');}
 finally{await plus.dispose();}
});

test('an independent catalog store refreshes global binding rules through its owned observation',async()=>{
 const {createRouterPlus}=await import('../dist/esm/index.js');const {createMemoryConnection}=await import('../dist/esm/testing/index.js');const {createStore}=await import('zustand/vanilla');const {registerZustandState}=await import('../dist/esm/stores/zustand.js');
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?version=v2'}}));const catalog=createStore(()=>({loaded:false,lookup:{}}));const filters=createStore(()=>({version:'initial'}));let notified,stopped=0;
 const stop=registerZustandState(plus,filters,{id:'filters',ready:()=>catalog.getState().loaded,observe:refresh=>{notified=refresh;const release=catalog.subscribe(refresh);return()=>{stopped++;release();};},query:true,fields:{version:{encode:id=>catalog.getState().lookup[id],decode:label=>Object.entries(catalog.getState().lookup).find(([,v])=>v===label)?.[0]??'initial'}}});
 try{await plus.whenReady();assert.equal(filters.getState().version,'initial');catalog.setState({loaded:true,lookup:{initial:'default',two:'v2'}});await plus.whenReady();assert.equal(filters.getState().version,'two');stop();assert.equal(stopped,1);catalog.setState({lookup:{initial:'default',three:'v2'}});notified();await tick();assert.equal(filters.getState().version,'two');assert.equal(plus.inspectState('filters'),null);}
 finally{stop();await plus.dispose();}
});

test('external rule observation supports initial notifications and failure-safe cleanup',async()=>{
 const {createRouterPlus}=await import('../dist/esm/index.js');const {createMemoryConnection}=await import('../dist/esm/testing/index.js');const {bindNativeSource}=await import('../dist/esm/core/native-bindings.js');
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?value=restored'}}));let ready=false,value='initial',detached=0,late;const stages=[];
 const source={read:()=>value,write:next=>value=next,subscribe:()=>()=>{detached++;}};
 const stop=bindNativeSource(plus,source,{id:'value',query:true,ready:()=>ready,observe:notify=>{late=notify;ready=true;notify();return()=>{throw new Error('cleanup');};}});
 try{await plus.whenReady();assert.equal(value,'restored');stop();late();assert.equal(detached,2);assert.equal(plus.inspectState('value'),null);assert.throws(()=>bindNativeSource(plus,source,{id:'bad',observe:true}),/observe/i);assert.equal(plus.inspectState('bad'),null);assert.throws(()=>bindNativeSource(plus,source,{id:'bad',observe:()=>{throw new Error('setup failed');}}),/setup failed/);assert.equal(plus.inspectState('bad'),null);}
 finally{stop();await plus.dispose();}
});

test('accidental asynchronous rule subscriptions retire their eventual resource',async()=>{
 const {createRouterPlus}=await import('../dist/esm/index.js');const {createMemoryConnection}=await import('../dist/esm/testing/index.js');const {bindNativeSource}=await import('../dist/esm/core/native-bindings.js');
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));let release=0,notify;
 try{assert.throws(()=>bindNativeSource(plus,{read:()=>0,write(){}},{id:'invalid',observe:async listener=>{notify=listener;await tick();return()=>{release++;};}}),/synchronous cleanup/);await tick();assert.equal(release,1);notify();assert.equal(plus.inspectState('invalid'),null);assert.throws(()=>bindNativeSource(plus,{read:()=>0,write(){}},{id:'rejected',observe:async()=>{throw new Error('invalid async observer');}}),/synchronous cleanup/);await tick();assert.equal(plus.inspectState('rejected'),null);}
 finally{await plus.dispose();}
});
