import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><div id="react"></div><div id="vue"></div>',{url:'http://localhost/a',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','SVGElement','Node','MutationObserver','history','location'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'),{createRoot}=await import('react-dom/client');
const {MemoryRouter,useLocation,useNavigate}=await import('react-router-dom');
const {createRouterPlus}=await import('../dist/esm/index.js');
const {createReactProvider,useRpState,useRpContext,useRpCallback,useRpRef}=await import('../dist/esm/react/index.js');
const Vue=await import('vue');
const {useRpRef:vueRef,useRpReactiveState,useRpComputedState,createVueRouterPlus}=await import('../dist/esm/vue/index.js');
const {createRouter,createMemoryHistory}=await import('vue-router');
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
const h=React.createElement;
const pages=[{path:'/a',title:'A'},{path:'/b',title:'B'}];

test('React hooks retain native values, setters, context/ref/callback access and clean up automatically',async()=>{
 const root=createRoot(document.getElementById('react'));const plus=createRouterPlus({pages,globalKey:false});const Provider=createReactProvider({useLocation,useNavigate});const context=React.createContext('dark');let value,set;
 function Page(){[value,set]=useRpState({category:'all',range:{from:1},draft:'typed'},{id:'filter',fields:{category:{query:true,values:['all','code']},range:{query:true}}});useRpContext(context,'theme');useRpRef(3,'reference');useRpCallback(next=>next+1,[],'increment');return h('span',null,value.category);}
 try{
  await React.act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a?category=code&range=%7B%22from%22%3A2%7D&unrelated=yes#anchor']},h(Provider,{plus},h(React.StrictMode,null,h(Page)))));await tick();});
  await React.act(async()=>{await plus.whenReady();await tick();});assert.equal(value.category,'code');assert.equal(value.range.from,2);assert.equal(value.draft,'typed');
  assert.equal(plus.getState('theme'),'dark');assert.equal((await plus.setState('light','theme')).reason,'state-readonly');assert.equal((await plus.callState('increment',4)).value,5);
  assert.equal((await plus.setState(9,'reference')).ok,true);assert.equal(plus.getState('reference'),9);
  await React.act(async()=>{set(previous=>({...previous,category:'all'}));await tick();});assert.match(plus.getContext().search,/category=all/);assert.match(plus.getContext().search,/unrelated=yes/);
  assert.equal(plus.getContext().hash,'#anchor');
 }finally {await React.act(async()=>root.unmount());}
 assert.equal(plus.listStateKeys().includes('theme'),false);await plus.dispose();
});

test('unregistered React hooks work without a provider',async()=>{
 const root=createRoot(document.getElementById('react'));let result;
 function Page(){result=useRpState(1);useRpRef(null);useRpCallback(()=>1,[]);return null;}
 await React.act(async()=>root.render(h(Page)));assert.equal(result[0],1);
 await React.act(async()=>result[1](value=>value+1));assert.equal(result[0],2);await React.act(async()=>root.unmount());
});

test('Vue setup hooks preserve proxy identity and readonly computed access with scope cleanup',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});
 await router.push('/a?category=code');await router.isReady();const plugin=createVueRouterPlus({plus,router});let filter,computed,scalar;
 const app=Vue.createApp({setup(){filter=useRpReactiveState({category:'all',draft:'typed'},{id:'filter',fields:{category:{query:true}}});scalar=vueRef(1,'count');computed=useRpComputedState(()=>scalar.value*2,'double');return()=>Vue.h('span',null,filter.category);}});
 app.use(plugin);app.mount(document.getElementById('vue'));await plus.whenReady();await Vue.nextTick();
 assert.equal(filter.category,'code');assert.equal(filter.draft,'typed');const identity=filter;
 assert.equal((await plus.setState({category:'all',draft:'typed'},'filter')).ok,true);assert.equal(filter,identity);
 await plus.setState(3,'count');assert.equal(computed.value,6);assert.equal((await plus.setState(7,'double')).reason,'state-readonly');
 app.unmount();assert.equal(plus.listStateKeys().includes('double'),false);await plus.dispose();
});

test('Pinia setup store hooks follow the store scope rather than a consuming component',async()=>{
 const {createPinia,defineStore,setActivePinia,disposePinia}=await import('pinia');
 const plus=createRouterPlus({pages,globalKey:false});const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});await router.push('/a');
 const plugin=createVueRouterPlus({plus,router});const pinia=createPinia();setActivePinia(pinia);let store;
 const useStore=defineStore('native-filter',()=>{const count=vueRef(1,'storeCount');return{count};});
 const app=Vue.createApp({setup(){store=useStore();return()=>null;}});app.use(pinia);app.use(plugin);app.mount(document.getElementById('vue'));await plus.whenReady();
 app.unmount();assert.equal(plus.getState('storeCount'),1);await plus.setState(4,'storeCount');assert.equal(store.count,4);
 store.$dispose();assert.equal(plus.listStateKeys().includes('storeCount'),false);disposePinia(pinia);await plus.dispose();
});

test('Vue reactive arrays and collections retain their native identities during external writes',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});await router.push('/a');
 const plugin=createVueRouterPlus({plus,router});let items,map,set;
 const app=Vue.createApp({setup(){items=useRpReactiveState([1,2],'items');map=useRpReactiveState(new Map([['a',1]]),'map');set=useRpReactiveState(new Set([1]),'set');return()=>null;}});app.use(plugin);app.mount(document.getElementById('vue'));
 await plus.setState([3],'items');await plus.setState(new Map([['b',2]]),'map');await plus.setState(new Set([4]),'set');
 assert.deepEqual([...items],[3]);assert.deepEqual([...map],[['b',2]]);assert.deepEqual([...set],[4]);app.unmount();await plus.dispose();
});

test('Vue object initial values remain immutable recovery defaults after nested mutations',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});await router.push('/a');
 const plugin=createVueRouterPlus({plus,router});let filter;
 const app=Vue.createApp({setup(){filter=useRpReactiveState({range:{from:1},draft:'typed'},{id:'filter',fields:{range:{query:true}}});return()=>null;}});app.use(plugin);app.mount(document.getElementById('vue'));await plus.whenReady();
 filter.range.from=2;await Vue.nextTick();await tick();assert.match(plus.getContext().search,/range=/);
 await plus.navigate('/a');await plus.whenReady();assert.equal(filter.range.from,1);assert.equal(filter.draft,'typed');
 app.unmount();await plus.dispose();
});

test('Vue component disposal releases query ownership for another live source',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});await router.push('/a');
 const plugin=createVueRouterPlus({plus,router});const first=Vue.ref(true);
 const child=id=>({setup(){vueRef('all',{id,query:'category'});return()=>null;}});const one=child('first'),two=child('second');
 const app=Vue.createApp({setup:()=>()=>Vue.h(first.value?one:two)});app.use(plugin);app.mount(document.getElementById('vue'));await plus.whenReady();
 first.value=false;await Vue.nextTick();await plus.whenReady();assert.equal(plus.getState('first'),undefined);assert.equal(plus.getState('second'),'all');app.unmount();await plus.dispose();
});


test('unregistered Vue ref wrapping preserves existing computed identity and laziness',()=>{
 let calls=0;const source=Vue.computed(()=>{calls++;return 2;});
 const result=vueRef(source);assert.equal(result,source);assert.equal(calls,0);assert.equal(result.value,2);assert.equal(calls,1);
});
