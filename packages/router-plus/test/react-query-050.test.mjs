import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<div id="root"></div>',{url:'https://app.test/a',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const R=await import('react'),{createRoot}=await import('react-dom/client');
const {MemoryRouter,useLocation,useNavigate,createMemoryRouter,RouterProvider}=await import('react-router-dom');
const {createRouterPlus}=await import('../dist/esm/index.js');
const {createReactProvider,createReactRouterPlus,useRpState,usePageQuery,RouterPlusOutlet}=await import('../dist/esm/react/index.js');
const h=R.createElement, Provider=createReactProvider({useLocation,useNavigate});
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const pages=[{path:'/a',retain:true},{path:'/b',retain:true}];
async function move(plus,to){let p;await R.act(async()=>{p=plus.navigate(to);await tick();});return p;}

test('React callback rules read committed catalogs and automatically restore when ready',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let config,value;
 function Page(){const [loaded,setLoaded]=R.useState(false);config=setLoaded;[value]=useRpState('overview',{id:'tab',query:true,ready:()=>loaded,validate:v=>loaded&&['overview','products'].includes(v)});return h('span',null,value);}
 const root=createRoot(document.getElementById('root'));
 try{
  await R.act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a?tab=products']},h(Provider,{plus},h(R.StrictMode,null,h(Page)))));await tick();});assert.equal(value,'overview');
  await R.act(async()=>{config(true);await tick();});await R.act(async()=>{await plus.whenReady();await tick();});assert.equal(value,'products');
 }finally{await R.act(async()=>root.unmount());await plus.dispose();}
});

test('same-turn functional query edits merge and old setters use the current address',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let set;
 function Page(){[,set]=usePageQuery();return null;}
 const root=createRoot(document.getElementById('root'));
 try{
  await R.act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a?keep=yes#anchor']},h(Provider,{plus},h(Page)))));
  const stale=set;let first,second;
  await R.act(async()=>{first=set(q=>{q.set('one','1');return q;},{replace:true});second=set(q=>{q.set('two','2');return q;},{replace:true});await tick();});
  assert.equal((await first).ok,true);assert.equal((await second).ok,true);assert.deepEqual(Object.fromEntries(new URLSearchParams(plus.getContext().search)),{keep:'yes',one:'1',two:'2'});
  await move(plus,'/a?new=yes#other');let p;await R.act(async()=>{p=stale(q=>{q.set('three','3');return q;},{replace:true});await tick();});await p;
  assert.deepEqual(Object.fromEntries(new URLSearchParams(plus.getContext().search)),{new:'yes',three:'3'});assert.equal(plus.getContext().hash,'#other');
 }finally{await R.act(async()=>root.unmount());await plus.dispose();}
});

test('owned Provider disposal ignores StrictMode probes and runs after final unmount',async()=>{
 const plus=createReactRouterPlus({router:h(MemoryRouter,{initialEntries:['/a']}),pages,globalKey:false,disposeOnUnmount:true});let disposed=0;
 const original=plus.dispose.bind(plus);plus.dispose=()=>{disposed++;return original();};
 const root=createRoot(document.getElementById('root'));
 await R.act(async()=>{root.render(h(R.StrictMode,null,h(plus.Provider)));await tick();});assert.equal(disposed,0);assert.equal(plus.connected,true);
 await R.act(async()=>{root.unmount();await tick();});assert.equal(disposed,1);assert.equal(plus.connected,false);
});

test('retained custom host receives active state while library freezes locations and releases instances',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});
 function Host({active,children}){return h(R.Activity,{mode:active?'visible':'hidden'},children);}
 function Layout(){return h(Provider,{plus},h(RouterPlusOutlet,{host:Host}));}
 function Page(){const location=useLocation();return h('input',{'data-page':location.pathname,defaultValue:location.pathname});}
 const router=createMemoryRouter([{element:h(Layout),children:[{path:'/a',element:h(Page)},{path:'/b',element:h(Page)}]}],{initialEntries:['/a']});
 const root=createRoot(document.getElementById('root'));
 try{
  await R.act(async()=>root.render(h(RouterProvider,{router})));const original=document.querySelector('[data-page="/a"]');original.value='keep';
  await move(plus,'/b');await move(plus,'/a');assert.equal(document.querySelector('[data-page="/a"]'),original);assert.equal(original.value,'keep');
  let release;await R.act(async()=>{release=plus.release();await tick();});await release;assert.notEqual(document.querySelector('[data-page="/a"]'),original);
 }finally{await R.act(async()=>root.unmount());router.dispose();await plus.dispose();}
});

test('React simultaneous readiness and user selection does not restore an older address',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let finish,choose,value;
 function Page(){const [ready,setReady]=R.useState(false);finish=setReady;[value,choose]=useRpState('overview',{id:'tab',query:true,ready:()=>ready});return null;}
 const root=createRoot(document.getElementById('root'));
 try{
  await R.act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a?tab=products']},h(Provider,{plus},h(Page))));await tick();});
  await R.act(async()=>{choose('references');finish(true);await tick();});await R.act(async()=>{await plus.whenReady();await tick();});
  assert.equal(value,'references');assert.equal(new URLSearchParams(plus.getContext().search).get('tab'),'references');
 }finally{await R.act(async()=>root.unmount());await plus.dispose();}
});

test('React asynchronous codecs use the latest committed lookup table',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let load,value;
 function Page(){const [catalog,setCatalog]=R.useState(null);load=setCatalog;[value]=useRpState('initial',{id:'version',query:true,ready:()=>catalog!==null,encode:v=>catalog[v],decode:raw=>Object.entries(catalog).find(([,label])=>label===raw)?.[0]??'initial'});return null;}
 const root=createRoot(document.getElementById('root'));
 try{
  await R.act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a?version=v2']},h(Provider,{plus},h(Page))));await tick();});
  await R.act(async()=>{load({initial:'default','ref-2':'v2'});await tick();});await R.act(async()=>{await plus.whenReady();await tick();});assert.equal(value,'ref-2');
 }finally{await R.act(async()=>root.unmount());await plus.dispose();}
});

test('React valid-to-valid codec catalog changes reproject the current address',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let load,value;
 function Page(){const [catalog,setCatalog]=R.useState({initial:'default',one:'v2'});load=setCatalog;[value]=useRpState('initial',{id:'version',query:true,ready:()=>true,encode:v=>catalog[v],decode:raw=>Object.entries(catalog).find(([,label])=>label===raw)?.[0]??'initial'});return null;}
 const root=createRoot(document.getElementById('root'));
 try{await R.act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a?version=v2']},h(Provider,{plus},h(Page))));await tick();});await R.act(async()=>{await plus.whenReady();await tick();});assert.equal(value,'one');await R.act(async()=>{load({initial:'default',two:'v2'});await tick();});await R.act(async()=>{await plus.whenReady();await tick();});assert.equal(value,'two');}
 finally{await R.act(async()=>root.unmount());await plus.dispose();}
});

test('a new React registration ID captures its own native default',async()=>{
 const {useReactState}=await import('../dist/esm/react/index.js');const plus=createRouterPlus({pages,globalKey:false});let swap,value;
 function Page(){const [id,setId]=R.useState('first');const native=R.useState('one');value=native[0];swap=()=>{native[1]('two');setId('second');};useReactState(native,{id,query:true});return null;}
 const root=createRoot(document.getElementById('root'));
 try{await R.act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(Page))));await tick();});await R.act(async()=>{swap();await tick();});await R.act(async()=>{await plus.whenReady();await tick();});assert.equal(value,'two');let reset;await R.act(async()=>{reset=plus.resetState('second');await tick();});await reset;assert.equal(value,'two');}
 finally{await R.act(async()=>root.unmount());await plus.dispose();}
});
