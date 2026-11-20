import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/a',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','Node','MutationObserver'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const { createElement:h, act }=await import('react');
const { createRoot }=await import('react-dom/client');
const { MemoryRouter,useLocation,useNavigate }=await import('react-router-dom');
const { createRouterPlus }=await import('../dist/esm/index.js');
const {createReactProvider,RouterPlusBoundary,usePageContext}=await import('../dist/esm/react/index.js');
const {usePageState}=await import('../dist/esm/react/hooks.js');
const Provider=createReactProvider({useLocation,useNavigate});
const pages=[{path:'/a',title:'A',retain:true,state:{initial:{v:1}}},{path:'/b',title:'B',retain:true,state:{initial:{v:2}}}];
const delay=()=>new Promise(r=>setTimeout(r,15));
async function navigate(plus,target){let pending;await act(async()=>{pending=plus.navigate(target);await delay();});return pending;}

test('real React provider distinguishes same-path query commits and keeps boundary scope',async()=>{
 const plus=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/a',search:'',hash:''}});
 const root=createRoot(document.getElementById('root'));let aContext=plus.getContext();const readings={},writers={};
 function Reader({id}){const [state,write]=usePageState();readings[id]={state,path:usePageContext().path};writers[id]=write;return h('span',null,String(state.v));}
 function App(){return h('div',null,h(RouterPlusBoundary,{context:aContext},h(Reader,{id:'a'})),h(Reader,{id:'current'}));}
 await act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(App))));});
 assert.equal((await navigate(plus,'/a?x=1')).ok,true);assert.equal(plus.getContext().search,'?x=1');
 assert.equal((await navigate(plus,'/a?x=2')).ok,true);assert.equal(plus.getContext().search,'?x=2');
 await navigate(plus,'/b');assert.equal(readings.a.path,'/a?x=2');assert.equal(readings.current.path,'/b');
 await act(async()=>{writers.a.set({v:9});await delay();});assert.equal(readings.a.state.v,9);assert.equal(readings.current.state.v,2);
 await act(async()=>root.unmount());await plus.dispose();
});

test('automatic React outlet retains DOM and freezes native router hooks',async()=>{
 const {createMemoryRouter,RouterProvider}=await import('react-router-dom');
 const {RouterPlusOutlet}=await import('../dist/esm/react/index.js');
 const plus=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/a',search:'',hash:''}});
 const readings={},writers={};let mounts=0;
 function Page({id}){const [value,write]=usePageState();const route=useLocation();writers[id]=write;readings[id]={path:route.pathname,v:value.v};return h('input',{defaultValue:id,'data-page':id});}
 function Layout(){return h(Provider,{plus},h(RouterPlusOutlet));}
 const router=createMemoryRouter([{element:h(Layout),children:[{path:'/a',element:h(Page,{id:'a'})},{path:'/b',element:h(Page,{id:'b'})}]}],{initialEntries:['/a']});
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(h(RouterProvider,{router})));
 const original=document.querySelector('[data-page="a"]');original.value='retained';
 await navigate(plus,'/b');await act(async()=>{writers.a.set({v:11});await delay();});assert.equal(readings.a.path,'/a');assert.equal(readings.b.v,2);
 await navigate(plus,'/a');assert.equal(document.querySelector('[data-page="a"]'),original);assert.equal(original.value,'retained');
 await act(async()=>root.unmount());router.dispose();await plus.dispose();
});

test('React native blocker and redirected commits retain actual routing facts',async()=>{
 const {createMemoryRouter,RouterProvider,useBlocker,redirect}=await import('react-router-dom');
 const BlockedProvider=createReactProvider({useLocation,useNavigate,useBlocker});
 const plus=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/a',search:'',hash:''}});
 function Layout(){return h(BlockedProvider,{plus},h('div'));}
 const router=createMemoryRouter([{element:h(Layout),children:[{path:'/a',element:h('span')},{path:'/b',element:h('span')},{path:'/redirect',loader:()=>redirect('/b'),element:h('span')}]}],{initialEntries:['/a']});
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(h(RouterProvider,{router})));
 const stop=plus.registerGuard({id:'leave',beforeLeave:()=>false});await act(async()=>{void router.navigate('/b');await delay();});assert.equal(router.state.location.pathname,'/a');stop();
 let task;await act(async()=>{task=plus.navigate('/redirect');await delay();});const result=await task;assert.equal(result.ok,true);assert.equal(plus.getContext().pathname,'/b');
 await act(async()=>root.unmount());router.dispose();await plus.dispose();
});

test('React hydration consumes the same explicit state seed',async()=>{
 const {renderToString}=await import('react-dom/server');const {hydrateRoot}=await import('react-dom/client');
 const seed=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/a',search:'',hash:''}});await seed.setState({v:27});const snapshot=await seed.snapshot();
 function State(){const [value]=usePageState();return h('span',null,String(value.v));}
 const tree=(plus)=>h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(State)));
 const server=createRouterPlus({pages,globalKey:false,initialSnapshot:snapshot});const container=document.getElementById('root');container.innerHTML=renderToString(tree(server));const errors=[];
 const client=createRouterPlus({pages,globalKey:false,initialSnapshot:snapshot});let root;await act(async()=>{root=hydrateRoot(container,tree(client),{onRecoverableError:error=>errors.push(error)});});assert.equal(container.textContent,'27');assert.deepEqual(errors,[]);
 await act(async()=>root.unmount());await seed.dispose();await server.dispose();await client.dispose();
});

test('route-relative navigation resolves from the calling nested route',async()=>{
 const {createMemoryRouter,RouterProvider,Outlet}=await import('react-router-dom');const {useRouterPlus}=await import('../dist/esm/react/index.js');let scoped;
 const plus=createRouterPlus({pages:[{path:'/parent/:id',title:'Nested'},{path:'/',title:'Root'}],globalKey:false,initialLocation:{pathname:'/parent/1',search:'',hash:''}});
 function Child(){scoped=useRouterPlus();return h('span');}function Layout(){return h(Provider,{plus},h(Outlet));}
 const router=createMemoryRouter([{element:h(Layout),children:[{path:'/parent/:id',element:h(Child)},{path:'/',element:h('span')}]}],{initialEntries:['/parent/1']});const root=createRoot(document.getElementById('root'));await act(async()=>root.render(h(RouterProvider,{router})));
 assert.equal(scoped.resolveHref('..'),'/');let task;await act(async()=>{task=scoped.navigate('..');await delay();});assert.equal((await task).ok,true);assert.equal(plus.getContext().path,'/');await act(async()=>root.unmount());router.dispose();await plus.dispose();
});

test('React tab selectors preserve concrete dynamic instances and their address',async()=>{
 const {usePageTab}=await import('../dist/esm/react/hooks.js');const pages=[{id:'detail',path:'/alpha/:id',title:'Alpha',tabs:[{id:'one'},{id:'two'}]}];
 const plus=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/alpha/first',search:'',hash:''}});let tabs;
 function App(){tabs=usePageTab('/alpha/second?x=1#mark');return h('span',null,tabs[0]);}const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(h(MemoryRouter,{initialEntries:['/alpha/first']},h(Provider,{plus},h(App)))));
 await act(async()=>{void plus.setTab('two');await delay();});assert.equal(tabs[0],'one');
 await act(async()=>{tabs[1]('two');await delay();});assert.equal(plus.getContext().path,'/alpha/second?x=1#mark');assert.equal(plus.getTab(),'two');
 await act(async()=>{tabs[1]('one');await delay();});assert.equal(plus.getContext().params.id,'second');assert.equal(plus.getTab(),'one');await act(async()=>root.unmount());await plus.dispose();
});

test('initial redirects await plugin readiness and the mounted connection',async()=>{
 const {RouterPlusRedirect}=await import('../dist/esm/react/index.js');let release;const gate=new Promise(r=>release=r);
 const plus=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/a',search:'',hash:''},plugins:[{id:'initial',setup:()=>gate}]});
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(RouterPlusRedirect,{to:'/b'})))));
 assert.equal(plus.getContext().pathname,'/a');await act(async()=>{release();await delay();});assert.equal(plus.getContext().pathname,'/b');await act(async()=>root.unmount());await plus.dispose();
});

test('assembled JSX router preserves props and children under StrictMode',async()=>{
 const {createReactRouterPlus,useRouterPlus}=await import('../dist/esm/react/index.js');
 const {StrictMode}=await import('react');let observed;
 function Probe(){observed=useRouterPlus();return h('span',{'data-assembled':true},useLocation().pathname);}
 const plus=createReactRouterPlus({router:h(MemoryRouter,{initialEntries:['/base/a'],basename:'/base'},h(Probe)),pages,globalKey:false});
 const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(h(StrictMode,null,h(plus.Provider,null,h('i',null,'child')))));
 assert.equal(observed.getContext().pathname,'/a');assert.equal(document.querySelector('[data-assembled]').textContent,'/a');
 assert.equal((await navigate(plus,'/b')).ok,true);assert.equal(document.querySelector('[data-assembled]').textContent,'/b');assert.equal(document.querySelector('i').textContent,'child');
 await act(async()=>root.unmount());assert.equal(plus.connected,false);await plus.dispose();
});

test('assembled Data Router keeps native routes, redirect receipts and blockers',async()=>{
 const {createMemoryRouter,redirect}=await import('react-router-dom');
 const {createReactRouterPlus,useRouterPlus}=await import('../dist/esm/react/index.js');let observed;
 function Page(){observed=useRouterPlus();return h('span',null,useLocation().pathname);}
 const router=createMemoryRouter([{path:'/a',element:h(Page)},{path:'/b',element:h(Page)},{path:'/redirect',loader:()=>redirect('/b')}],{initialEntries:['/a']});
 const plus=createReactRouterPlus({router,pages,globalKey:false});const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(h(plus.Provider)));assert.equal(observed.getContext().pathname,'/a');
 const stop=plus.registerGuard({id:'assembled-leave',beforeLeave:()=>false});
 await act(async()=>{void router.navigate('/b');await delay();});assert.equal(router.state.location.pathname,'/a');stop();
 assert.equal((await navigate(plus,'/redirect')).ok,true);assert.equal(plus.getContext().pathname,'/b');
 await act(async()=>root.unmount());assert.equal(plus.connected,false);await plus.dispose();
 // A supplied router remains usable after the Plus owner disposes.
 await router.navigate('/a');assert.equal(router.state.location.pathname,'/a');router.dispose();
});


test('tuple router constructs internally and preserves native props and child context',async()=>{
 const {createReactRouterPlus,useRouterPlus}=await import('../dist/esm/react/index.js');
 function Probe(){const plus=useRouterPlus();return h('span',{'data-tuple':true},useLocation().pathname);}
 const plus=createReactRouterPlus({router:[MemoryRouter,{initialEntries:['/base/a'],basename:'/base'}],pages,globalKey:false});
 const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(h(plus.Provider,null,h(Probe))));
 assert.equal(document.querySelector('[data-tuple]').textContent,'/a');
 assert.equal((await navigate(plus,'/b')).ok,true);assert.equal(document.querySelector('[data-tuple]').textContent,'/b');
 await act(async()=>root.unmount());assert.equal(plus.connected,false);await plus.dispose();
});

test('React overlay theme changes preserve the active highlight and runtime',async()=>{
 const {RouterPlusOverlay}=await import('../dist/esm/react/index.js');const plus=createRouterPlus({pages,globalKey:false});
 const root=createRoot(document.getElementById('root'));const render=theme=>h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(RouterPlusOverlay,{theme})));
 await act(async()=>{root.render(render({zIndex:30,highlightPadding:8}));await delay();});await plus.whenReady();
 const rect={left:0,top:0,right:20,bottom:20,width:20,height:20};await act(async()=>{await plus.highlight({rect:()=>rect},{spotlight:true});await delay();});
 const overlay=document.querySelector('.rp-overlay-root'),highlight=plus.getHighlight();
 await act(async()=>{root.render(render({zIndex:12,highlightBorderWidth:0}));await delay();});
 assert.equal(document.querySelector('.rp-overlay-root'),overlay);assert.equal(plus.getHighlight(),highlight);assert.equal(overlay.style.getPropertyValue('--rp-z-index'),'12');assert.equal(overlay.style.getPropertyValue('--rp-highlight-padding'),'');assert.equal(overlay.style.getPropertyValue('--rp-highlight-border-width'),'0px');
 await act(async()=>root.unmount());assert.equal(document.querySelector('.rp-overlay-root'),null);await plus.dispose();
});

test('React highlight component receives geometry and typed details inside App context',async()=>{
 const {RouterPlusOverlay}=await import('../dist/esm/react/index.js');const {createContext,useContext,useEffect}=await import('react');const Brand=createContext('missing');let received,mounts=0,unmounts=0;
 function AppHighlight(props){received=props;const brand=useContext(Brand),route=useLocation();useEffect(()=>{mounts++;return()=>unmounts++;},[]);return h('i',{className:'app-react-highlight',style:{width:'100%',height:'100%',borderRadius:'3px'}},brand+route.pathname);}
 const plus=createRouterPlus({pages,globalKey:false});const root=createRoot(document.getElementById('root'));const tick=()=>new Promise(r=>setTimeout(r,35));
 const view=component=>h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(Brand.Provider,{value:'App'},h(RouterPlusOverlay,{highlightComponent:component,theme:{zIndex:55,highlightRadius:99}}))));
 await act(async()=>{root.render(view(AppHighlight));await tick();});await plus.whenReady();const box=document.querySelector('.rp-overlay-highlight');let bounds={left:4,top:4,width:72,height:32};box.getBoundingClientRect=()=>bounds;
 const target={left:10,top:10,width:60,height:20,right:70,bottom:30};await act(async()=>{await plus.highlight({rect:()=>target},{spotlight:true,message:'Detail',placement:'top'});await tick();});
 assert.deepEqual([received.width,received.height,received.left,received.top],[72,32,4,4]);assert.equal(received.context.highlight.message,'Detail');assert.equal(received.context.page.pathname,'/a');assert.equal(typeof received.context.next,'function');assert.equal(received.context.targetRect.width,60);assert.equal(document.querySelector('.app-react-highlight').textContent,'App/a');assert.equal(document.querySelector('.app-react-highlight').style.borderRadius,'3px');assert.equal(document.querySelector('.rp-overlay-tip').hidden,true);assert.equal(mounts,1);
 bounds={left:20,top:25,width:100,height:40};await act(async()=>{window.dispatchEvent(new window.Event('resize'));await tick();});assert.deepEqual([received.width,received.height,received.left,received.top],[100,40,20,25]);assert.equal(mounts,1);
 await act(async()=>{root.render(view(undefined));await tick();});assert.equal(unmounts,1);assert.equal(document.querySelector('.app-react-highlight'),null);assert.equal(document.querySelector('.rp-overlay-spotlight').hidden,false);
 await act(async()=>{root.render(view(AppHighlight));await tick();});assert.equal(mounts,2);await act(async()=>{await plus.clearHighlight();await tick();});assert.equal(unmounts,2);assert.equal(document.querySelector('.app-react-highlight'),null);await act(async()=>root.unmount());await plus.dispose();
});

test('StrictMode custom highlight cleanup leaves no duplicate content or overlay',async()=>{
 const {RouterPlusOverlay}=await import('../dist/esm/react/index.js');const {StrictMode}=await import('react');const plus=createRouterPlus({pages,globalKey:false});const root=createRoot(document.getElementById('root'));const tick=()=>new Promise(r=>setTimeout(r,35));
 function Highlight({width,height}){return h('i',{className:'strict-highlight',style:{width,height}});}
 await act(async()=>{root.render(h(StrictMode,null,h(MemoryRouter,{initialEntries:['/a']},h(Provider,{plus},h(RouterPlusOverlay,{highlightComponent:Highlight})))));await tick();});await plus.whenReady();
 const rect={left:1,top:1,right:20,bottom:20,width:19,height:19};await act(async()=>{await plus.highlight({rect:()=>rect});await tick();});assert.equal(document.querySelectorAll('.strict-highlight').length,1);assert.equal(document.querySelectorAll('.rp-overlay-root').length,1);
 await act(async()=>root.unmount());assert.equal(document.querySelectorAll('.strict-highlight').length,0);assert.equal(document.querySelectorAll('.rp-overlay-root').length,0);await plus.dispose();
});

test('existing React state registers once and synchronizes query values in both directions',async()=>{
 const {useState}=await import('react');
 const {useRegisterState}=await import('../dist/esm/react/state-bridge.js');
 const rules={default:'all',values:['all','code'],query:true};
 const plus=createRouterPlus({pages:[{path:'/a',title:'A',states:{category:rules}}],globalKey:false});
 const root=createRoot(document.getElementById('root'));let value,set;
 function Page(){[value,set]=useState('all');useRegisterState('category',value,set);return h('span',{'data-category':true},value);}
 try {
  await act(async()=>{root.render(h(MemoryRouter,{initialEntries:['/a?category=code']},h(Provider,{plus},h(Page))));await delay();});
  await act(async()=>{await plus.whenReady();await delay();});assert.equal(value,'code');
  await act(async()=>{set('all');await delay();});assert.match(plus.getContext().search,/category=all/);
  let task;await act(async()=>{task=plus.setState('code','category');await delay();});assert.equal((await task).ok,true);
  assert.equal(value,'code');assert.equal(document.querySelector('[data-category]').textContent,'code');
 }finally {await act(async()=>root.unmount());await plus.dispose();}
});
