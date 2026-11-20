import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/a'});
for(const key of ['window','document','Element','HTMLElement','SVGElement','Node','history','location'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createElement:h,act}=await import('react');const {createRoot}=await import('react-dom/client');
const rr=await import('react-router-dom');const vr=await import('vue-router');
const {createRouterPlus}=await import('../dist/esm/index.js');const {createReactProvider}=await import('../dist/esm/react/index.js');const {createVueRouterPlus}=await import('../dist/esm/vue/index.js');
const pages=[{id:'a',path:'/a',title:'A',retain:true,tabs:[{id:'one'},{id:'two'}],state:{initial:{n:0}}},{id:'b',path:'/b',title:'B',state:{initial:{n:10}}}];

for(const framework of ['react','vue'])test(`${framework} shared navigation/state/history/guard conformance`,async()=>{
 const plus=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/a',search:'',hash:''}});let cleanup;let run=fn=>fn();
 if(framework==='react'){
  const Provider=createReactProvider({useLocation:rr.useLocation,useNavigate:rr.useNavigate,useBlocker:rr.useBlocker});
  const router=rr.createMemoryRouter([{element:h(Provider,{plus},h('span')),children:[{path:'/a',element:h('span')},{path:'/b',element:h('span')}]}],{initialEntries:['/a']});const root=createRoot(document.getElementById('root'));await act(async()=>root.render(h(rr.RouterProvider,{router})));
  run=async fn=>{let result;await act(async()=>{result=fn();await new Promise(r=>setTimeout(r,15));});return result;};
  cleanup=async()=>{await act(async()=>root.unmount());router.dispose();};
 }else{
  const router=vr.createRouter({history:vr.createMemoryHistory(),routes:pages.map(p=>({path:p.path,component:{}}))});await router.push('/a');const plugin=createVueRouterPlus({plus,router});plugin.install({use(){},provide(){},config:{globalProperties:{}}});cleanup=async()=>plugin.disconnect();
 }
 assert.equal((await run(()=>plus.setTab('two'))).ok,true);await run(()=>plus.setState({n:7}));assert.equal((await run(()=>plus.navigate('/b?x=1&x=2'))).ok,true);assert.deepEqual(plus.getContext().queryAll,[['x','1'],['x','2']]);assert.deepEqual(plus.getState(),{n:10});
 assert.equal((await run(()=>plus.back())).ok,true);assert.equal(plus.getTab(),'two');assert.deepEqual(plus.getState(),{n:7});
 const stop=plus.registerGuard({id:'deny',beforeLeave:()=>false});assert.equal((await run(()=>plus.navigate('/b'))).reason,'blocked');assert.equal(plus.getContext().pathname,'/a');stop();await cleanup();await plus.dispose();
});
