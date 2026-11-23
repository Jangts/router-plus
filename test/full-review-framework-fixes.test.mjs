import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<div id="app"></div>',{url:'https://app.test/'});
for(const key of ['window','document','HTMLElement','Element','SVGElement','Node','MutationObserver','history','location'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const V=await import('vue'),VR=await import('vue-router'),VP=await import('../dist/esm/vue/index.js');
const tick=()=>new Promise(r=>setTimeout(r,0));
async function vueMount(Page,pages,url='/a?q=one'){
 const router=VR.createRouter({history:VR.createMemoryHistory(),routes:[{path:'/a',component:Page},{path:'/b',component:Page},{path:'/c',component:Page}]});await router.push(url);const plus=VP.createVueRouterPlus({router,pages,globalKey:false});const app=V.createApp({render:()=>V.h(VP.RouterPlusView)});app.use(plus);app.mount('#app');await tick();return{plus,router,async close(){app.unmount();await plus.dispose();}};
}
test('Vue scoped native route updates same-page queries and freezes inactive routes',async()=>{
 const routes={};let requests=0;
 const Page={setup(){const route=VR.useRoute(),id=route.path;routes[id]=route;V.watch(()=>route.query.q,()=>requests++,{immediate:true});return()=>V.h('span',{'data-route':id},route.fullPath);}};
 const f=await vueMount(Page,[{path:'/a',retain:true},{path:'/b',retain:true}]);
 try{await f.plus.navigate('/a?q=two');await tick();assert.equal(String(routes['/a'].query.q),'two');assert.deepEqual(routes['/a'].query.q,f.router.currentRoute.value.query.q);assert.equal(requests,2);await f.plus.navigate('/b?q=other');await tick();assert.equal(String(routes['/a'].query.q),'two');await f.plus.navigate('/a?q=three');await tick();assert.deepEqual(routes['/a'].query.q,f.router.currentRoute.value.query.q);assert.equal(String(routes['/a'].query.q),'three');assert.equal(String(routes['/b'].query.q),'other');}
 finally{await f.close();}
});
test('Vue manual retention preserves DOM and scope metadata; release rebuilds',async()=>{
 const Page={render:()=>V.h('input')};const f=await vueMount(Page,[{path:'/a'},{path:'/b'}],'/a');
 try{const original=document.querySelector('input');original.value='keep';const scope=f.plus.scope();await f.plus.retain();await tick();assert.equal(scope.getContext().instance.retained,true);await f.plus.navigate('/b');await tick();await f.plus.navigate('/a');await tick();assert.equal(document.querySelector('input'),original);assert.equal(original.value,'keep');await f.plus.navigate('/b');await tick();await f.plus.navigate('/a');await tick();assert.equal(document.querySelector('input'),original);await f.plus.release();await tick();assert.notEqual(document.querySelector('input'),original);}
 finally{await f.close();}
});
test('Vue Redirect reacts to target changes and stops watching after unmount',async()=>{
 const router=VR.createRouter({history:VR.createMemoryHistory(),routes:['/a','/b','/c'].map(path=>({path,component:{render:()=>null}}))});await router.push('/a');const plus=VP.createVueRouterPlus({router,pages:['/a','/b','/c'].map(path=>({path})),globalKey:false});const to=V.ref('/b'),shown=V.ref(true);const app=V.createApp({render:()=>shown.value?V.h(VP.RouterPlusRedirect,{to:to.value}):null});app.use(plus);app.mount('#app');
 try{await tick();assert.equal(router.currentRoute.value.path,'/b');to.value='/c';await tick();assert.equal(router.currentRoute.value.path,'/c');shown.value=false;await V.nextTick();to.value='/a';await tick();assert.equal(router.currentRoute.value.path,'/c');}
 finally{app.unmount();await plus.dispose();}
});
const R=await import('react'),{createRoot}=await import('react-dom/client'),RR=await import('react-router-dom'),RP=await import('../dist/esm/react/index.js'),{createRouterPlus}=await import('../dist/esm/index.js');
test('React hash navigation preserves query through hook and object targets',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});const Provider=RP.createReactProvider({useLocation:RR.useLocation,useNavigate:RR.useNavigate});let hook;
 function Page(){hook=RP.useRouterPlus();return null;}const root=createRoot(document.getElementById('app'));
 try{await R.act(async()=>root.render(R.createElement(RR.MemoryRouter,{initialEntries:['/a?keep=yes#old']},R.createElement(Provider,{plus},R.createElement(Page)))));assert.equal(hook.resolveHref('#new'),'/a?keep=yes#new');assert.equal(hook.resolveHref({path:'#new'}),'/a?keep=yes#new');let pending;await R.act(async()=>{pending=hook.navigate('#new');await tick();});assert.equal((await pending).ok,true);assert.equal(plus.getContext().search,'?keep=yes');}
 finally{await R.act(async()=>root.unmount());await plus.dispose();}
});
test('React manual retain keeps the current outlet until explicit release',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a'},{path:'/b'}],globalKey:false}),Provider=RP.createReactProvider({useLocation:RR.useLocation,useNavigate:RR.useNavigate});
 function Layout(){return R.createElement(Provider,{plus},R.createElement(RP.RouterPlusOutlet));}const router=RR.createMemoryRouter([{element:R.createElement(Layout),children:[{path:'/a',element:R.createElement('input',{'data-page':'a'})},{path:'/b',element:R.createElement('span')}]}],{initialEntries:['/a']});const root=createRoot(document.getElementById('app'));
 const move=async to=>{let pending;await R.act(async()=>{pending=plus.navigate(to);await tick();});await pending;};
 try{await R.act(async()=>root.render(R.createElement(RR.RouterProvider,{router})));const original=document.querySelector('input');original.value='keep';await R.act(async()=>{await plus.retain();await tick();});await move('/b');await move('/a');assert.equal(document.querySelector('input'),original);assert.equal(original.value,'keep');await move('/b');await move('/a');assert.equal(document.querySelector('input'),original);await R.act(async()=>{await plus.release();await tick();});assert.notEqual(document.querySelector('input'),original);}
 finally{await R.act(async()=>root.unmount());router.dispose();await plus.dispose();}
});


test('React retained hash links use their own latest query while another page is active',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a',retain:true},{path:'/b',retain:true}],globalKey:false}),Provider=RP.createReactProvider({useLocation:RR.useLocation,useNavigate:RR.useNavigate}),hooks={};
 function Layout(){return R.createElement(Provider,{plus},R.createElement(RP.RouterPlusOutlet));}function Page(){const location=RR.useLocation();hooks[location.pathname]=RP.useRouterPlus();return null;}
 const router=RR.createMemoryRouter([{element:R.createElement(Layout),children:[{path:'/a',element:R.createElement(Page)},{path:'/b',element:R.createElement(Page)}]}],{initialEntries:['/a?keep=one']});const root=createRoot(document.getElementById('app'));
 const move=async to=>{let p;await R.act(async()=>{p=plus.navigate(to);await tick();});await p;};
 try{await R.act(async()=>root.render(R.createElement(RR.RouterProvider,{router})));const old=hooks['/a'];await move('/a?keep=two');assert.equal(old.resolveHref('#part'),'/a?keep=two#part');await move('/b?other=yes');assert.equal(hooks['/a'].resolveHref('#part'),'/a?keep=two#part');assert.equal(hooks['/a'].resolveHref({path:'#part'}),'/a?keep=two#part');}
 finally{await R.act(async()=>root.unmount());router.dispose();await plus.dispose();}
});
