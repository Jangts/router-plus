import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><div id="react"></div><div id="vue"></div>',{url:'http://localhost/a',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','SVGElement','Node','MutationObserver','history','location'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'),{createRoot}=await import('react-dom/client');const {MemoryRouter,useLocation,useNavigate}=await import('react-router-dom');
const Vue=await import('vue'),{createRouter,createMemoryHistory}=await import('vue-router');
const {createRouterPlus}=await import('../dist/esm/index.js');const {createReactProvider,useReactState}=await import('../dist/esm/react/index.js');const {createVueRouterPlus,useVueState}=await import('../dist/esm/vue/index.js');
const pages=[{path:'/a',title:'A'}],tick=()=>new Promise(resolve=>setTimeout(resolve,10));const h=React.createElement;const Provider=createReactProvider({useLocation,useNavigate});

test('existing React tuples, refs and accessors retain identity and cleanup under Strict Mode',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const root=createRoot(document.getElementById('react'));let value,tuple,input;
 function Page(){tuple=React.useState(()=>()=>1);[value]=tuple;input=React.useRef(2);const [number,setNumber]=React.useState(3);useReactState(tuple,'functionValue');useReactState(input,'ref');useReactState({get:()=>number,set:next=>setNumber(next)},'number');useReactState({get:()=>number*2},'readonly');return null;}
 await React.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(React.StrictMode,null,h(Page))))));
 let result;await React.act(async()=>{result=await plus.setState(()=>4,'functionValue');await plus.setState(8,'number');await tick();});assert.equal(result.ok,true);assert.equal(value(),4);assert.equal(plus.getState('number'),8);assert.equal(plus.getState('readonly'),16);assert.equal((await plus.setState(3,'readonly')).reason,'state-readonly');await plus.setState(9,'ref');assert.equal(input.current,9);
 await React.act(async()=>root.unmount());assert.equal(plus.getState('number'),undefined);await plus.dispose();
});

test('abandoned React renders do not publish new callbacks or getters',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const root=createRoot(document.getElementById('react'));let set;const never=new Promise(()=>{});
 function Child({value}){useReactState(()=>value,'callback');useReactState({get:()=>value},'accessor');if(value==='abandoned')throw never;return h('span',null,value);}
 function App(){const [value,write]=React.useState('committed');set=write;return h(React.Suspense,{fallback:h('span',null,'loading')},h(Child,{value}));}
 await React.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(App)))));
 await React.act(async()=>{React.startTransition(()=>set('abandoned'));await tick();});assert.equal((await plus.callState('callback')).value,'committed');assert.equal(plus.getState('accessor'),'committed');
 await React.act(async()=>{set('final');await tick();});assert.equal((await plus.callState('callback')).value,'final');await React.act(async()=>root.unmount());await plus.dispose();
});

test('Vue existing sources preserve containers, accessor receivers and readonly capability',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});await router.push('/a');const plugin=createVueRouterPlus({plus,router});const ref=Vue.ref(1),map=Vue.reactive(new Map([['a',1]])),readonly=Vue.readonly(Vue.reactive({value:2})),object=Vue.reactive({get:'business',value:3});const model={state:Vue.ref(4),get(){return this.state.value;},set(next){this.state.value=next;}};
 const app=Vue.createApp({setup(){useVueState(ref,'ref');useVueState(map,'map');useVueState(readonly,'readonly');useVueState(object,'object');useVueState(model,'accessor');return()=>null;}});app.use(plugin);app.mount(document.getElementById('vue'));await plus.whenReady();
 await plus.setState(5,'ref');assert.equal(ref.value,5);await plus.setState(map,'map');assert.deepEqual([...map],[['a',1]]);await plus.setState(6,'accessor');assert.equal(model.state.value,6);model.state.value=7;await Vue.nextTick();assert.equal(plus.getState('accessor'),7);assert.equal(plus.getState('object'),object);assert.equal((await plus.setState({value:4},'readonly')).reason,'state-readonly');
 app.unmount();assert.equal(plus.getState('ref'),undefined);await plus.dispose();
});

test('existing-state hooks without options do not need an owner',async()=>{
 Vue.effectScope().run(()=>{useVueState(Vue.ref(1));});
 const root=createRoot(document.getElementById('react'));function Page(){useReactState(React.useState(1));return null;}
 await React.act(async()=>root.render(h(Page)));await React.act(async()=>root.unmount());
});

test('React existing-source ID and capability changes release old registrations',async()=>{
 const plus=createRouterPlus({pages,globalKey:false}),root=createRoot(document.getElementById('react'));let update;
 function Page(){const [mode,setMode]=React.useState(0);update=setMode;const source=mode===0?{get:()=>1,set:()=>{}}:mode===1?{get:()=>2}:()=>3;useReactState(source,mode===2?'renamed':'value');return null;}
 await React.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(Page)))));
 await React.act(async()=>update(1));assert.equal(plus.getState('value'),2);assert.equal((await plus.setState(4,'value')).reason,'state-readonly');
 await React.act(async()=>update(2));assert.equal(plus.getState('value'),undefined);assert.equal((await plus.callState('renamed')).value,3);await React.act(async()=>root.unmount());await plus.dispose();
});


test('Vue commands forward business receipts, callable replacements, errors and owner cancellation',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});
 const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});await router.push('/a');
 const plugin=createVueRouterPlus({plus,router});let release;const gate=new Promise(resolve=>release=resolve);
 const owner={label:'native',apply(fields,mode){return {label:this.label,applied:Object.keys(fields),conflicts:[],mode};}};
 const callback=Vue.shallowRef((n)=>n+1);
 const app=Vue.createApp({setup(){
  useVueState(owner.apply.bind(owner),'patch');
  useVueState(async(fields,mode)=>{await Promise.resolve();return owner.apply(fields,mode);},'async-patch');
  useVueState(callback,'callback');
  useVueState(Vue.computed(()=>callback.value),'computed-callback');
  useVueState({get:()=>callback.value},'function-value');
  useVueState(()=>{throw new Error('business validation');},'error');
  useVueState(async()=>{await gate;return 7;},'pending');
  assert.throws(()=>useVueState(()=>1,{id:'query-callback',query:true}));
  return()=>null;
 }});app.use(plugin);app.mount(document.getElementById('vue'));await plus.whenReady();
 const expected={label:'native',applied:['name'],conflicts:[],mode:'merge'};
 assert.deepEqual((await plus.callState('patch',{name:'Summer'},'merge')).value,expected);
 assert.deepEqual((await plus.callState('async-patch',{name:'Summer'},'merge')).value,expected);
 assert.equal((await plus.setState(()=>0,'patch')).reason,'state-readonly');
 assert.equal((await plus.callState('callback',2)).value,3);callback.value=(n)=>n*2;
 assert.equal((await plus.callState('callback',3)).value,6);
 assert.equal((await plus.callState('computed-callback',3)).value,6);
 assert.equal((await plus.callState('function-value')).reason,'state-unsupported');
 const failure=await plus.callState('error');assert.equal(failure.reason,'failed');assert.equal(failure.message,'business validation');
 callback.value=3;assert.equal((await plus.callState('callback')).reason,'failed');
 const pending=plus.callState('pending');app.unmount();release();assert.equal((await pending).reason,'cancelled');
 assert.equal((await plus.callState('patch')).reason,'state-unknown');await plugin.dispose();
});

test('React links preserve native empty-string download behavior',async()=>{
 const {RouterPlusLink}=await import('../dist/esm/react/index.js');const plus=createRouterPlus({pages,globalKey:false}),root=createRoot(document.getElementById('react'));
 await React.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(RouterPlusLink,{to:'/a',download:''},'download')))));
 const event=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0});let prevented;
 document.addEventListener('click',e=>{prevented=e.defaultPrevented;e.preventDefault();},{once:true});await React.act(async()=>document.querySelector('#react a').dispatchEvent(event));assert.equal(prevented,false);await React.act(async()=>root.unmount());await plus.dispose();
});

test('layout effects see the previous source under an old ID until passive cleanup',async()=>{
 const plus=createRouterPlus({pages,globalKey:false}),root=createRoot(document.getElementById('react'));let change,pending,observed;
 function Page(){const [id,setId]=React.useState(0);change=setId;useReactState(()=>id,id?'after':'before');React.useLayoutEffect(()=>{if(id){observed=plus.getState('before')();pending=plus.callState('before');}},[id]);return null;}
 await React.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(Page)))));await React.act(async()=>change(1));assert.equal(observed,0);assert.equal((await pending).reason,'cancelled');assert.equal((await plus.callState('after')).value,1);await React.act(async()=>root.unmount());await plus.dispose();
});

test('a suspended retained-view candidate cannot replace the last committed frozen context',async()=>{
 const {RouterPlusRetained,usePageContext}=await import('../dist/esm/react/index.js');const plus=createRouterPlus({pages:[{path:'/a',title:'A',retain:true},{path:'/b',title:'B',retain:true}],globalKey:false}),root=createRoot(document.getElementById('react'));let change,contextA,contextB;const never=new Promise(()=>{});
 function Child(){const context=usePageContext();if(context.pageId==='/b')throw never;return h('span',{'data-retained-probe':true},context.pageId);}
 function App(){const [mode,setMode]=React.useState(0);change=setMode;const context=mode===1?contextB:contextA;return h(React.Suspense,{fallback:'pending'},h(RouterPlusRetained,{active:mode!==2,context},h(Child)));}
 // Obtain stable contexts through a separate in-memory connection before mounting native UI.
 const {createMemoryConnection}=await import('../dist/esm/testing/index.js');const detach=plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));contextA=plus.getContext();await plus.navigate('/b');contextB=plus.getContext();await plus.navigate('/a');detach();
 await React.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(App)))));await React.act(async()=>{React.startTransition(()=>change(1));await tick();});await React.act(async()=>change(2));assert.equal(document.querySelector('[data-retained-probe]').textContent,'/a');await React.act(async()=>root.unmount());await plus.dispose();
});

test('Vue app cleanup supports apps without onUnmount while preserving native unmount',async()=>{
 const listeners=new Set(),router={currentRoute:{value:{path:'/a',fullPath:'/a',hash:''}},afterEach(fn){listeners.add(fn);return()=>listeners.delete(fn);},push(){}};
 const plugin=createVueRouterPlus({router,pages,globalKey:false});const app={config:{globalProperties:{}},provide(){},calls:0,unmount(){this.calls++;return 42;}};plugin.install(app);assert.equal(listeners.size,1);assert.equal(app.unmount(),42);assert.equal(listeners.size,0);app.unmount();assert.equal(app.calls,2);assert.equal((await plugin.navigate('/a')).reason,'cancelled');await plugin.dispose();
});

test('React grouped navigation, tab, panel, form and submit observe committed closures',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a',title:'A'},{path:'/b',title:'B'}],globalKey:false});const root=createRoot(document.getElementById('react'));let submitted;
 function Form(){const state=React.useState({name:''});useReactState(state,'form');useReactState(()=>{submitted=state[0].name;return submitted;},'save');return null;}
 function Panel(){const state=React.useState(false);useReactState(state,'panel');return state[0]?h(Form):null;}
 function Page(){const state=React.useState('summary');useReactState(state,'tab');return state[0]==='details'?h(Panel):null;}
 function App(){return useLocation().pathname==='/b'?h(Page):null;}
 await React.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(App)))));
 let result;const pending=plus.execute([{kind:'navigate',target:'/b'},{kind:'tab.set',tab:'details'},{kind:'state.set',key:'panel',value:true},{kind:'state.patch',key:'form',value:{name:'Ivan'}},{kind:'state.call',id:'save'}],{timeoutMs:2000}).then(value=>result=value);
 for(let index=0;index<30&&!result;index++)await React.act(async()=>{await tick();});await pending;assert.equal(result.ok,true);assert.equal(submitted,'Ivan');assert.equal(result.results[4].value,'Ivan');await React.act(async()=>root.unmount());await plus.dispose();
});

test('Vue grouped panel mounting and form writes precede native submit',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const router=createRouter({history:createMemoryHistory(),routes:pages.map(page=>({path:page.path,component:{render:()=>null}}))});await router.push('/a');const plugin=createVueRouterPlus({plus,router});let submitted;
 const Form={setup(){const form=Vue.ref({name:''});useVueState(form,'form');useVueState(()=>{submitted=form.value.name;return submitted;},'save');return()=>null;}};
 const App={setup(){const panel=Vue.ref(false);useVueState(panel,'panel');return()=>panel.value?Vue.h(Form):null;}};const app=Vue.createApp(App);app.use(plugin);app.mount(document.getElementById('vue'));
 const result=await plus.execute([{kind:'state.set',key:'panel',value:true},{kind:'state.patch',key:'form',value:{name:'Ivan'}},{kind:'state.call',id:'save'}]);assert.equal(result.ok,true);assert.equal(submitted,'Ivan');app.unmount();await plus.dispose();
});
