import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<div id="react"></div><div id="vue"></div>',{url:'https://app.test/a'});
for(const key of ['window','document','HTMLElement','Element','SVGElement','Node','MutationObserver','history','location'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react'),{createRoot}=await import('react-dom/client');
const {MemoryRouter,useLocation,useNavigate}=await import('react-router-dom');
const {createRouterPlus}=await import('../dist/esm/index.js');
const RPReact=await import('../dist/esm/react/index.js');
const Vue=await import('vue'),{createRouter,createMemoryHistory}=await import('vue-router');
const RPVue=await import('../dist/esm/vue/index.js');
const tick=()=>new Promise(r=>setTimeout(r,0));
const pages=[{path:'/a',retain:true},{path:'/b',retain:true}];

test('React links support native document navigation and complete disabled href behavior',async()=>{
 const plus=createRouterPlus({pages,globalKey:false}),Provider=RPReact.createReactProvider({useLocation,useNavigate});const root=createRoot(document.getElementById('react'));
 try{
  await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/a']},React.createElement(Provider,{plus},React.createElement(React.Fragment,null,
   React.createElement(RPReact.RouterPlusLink,{to:'/b',reloadDocument:true,'data-link':'native'},'native'),
   React.createElement(RPReact.RouterPlusLink,{to:'/b',disabled:true,'data-link':'disabled'},'disabled'),
   React.createElement(RPReact.RouterPlusLink,{to:'https://outside.test',disabled:true,'data-link':'external'},'external'),React.createElement(RPReact.RouterPlusLink,{to:{action:'missing-action'},disabled:true,'data-link':'action','aria-describedby':'details',style:{color:'red'}},'action'))))));
  const native=document.querySelector('[data-link="native"]'),disabled=document.querySelector('[data-link="disabled"]'),external=document.querySelector('[data-link="external"]');
  assert.equal(native.getAttribute('href'),'/b');const action=document.querySelector('[data-link="action"]');assert.ok(action);assert.equal(action.disabled,true);assert.equal(action.getAttribute('aria-describedby'),'details');assert.equal(action.style.color,'red');
  for(const element of [disabled,external]){assert.equal(element.hasAttribute('href'),false);assert.equal(element.getAttribute('aria-disabled'),'true');assert.equal(element.tabIndex,-1);const event=new window.MouseEvent('click',{bubbles:true,cancelable:true});element.dispatchEvent(event);assert.equal(event.defaultPrevented,true);}
  const click=new window.MouseEvent('click',{bubbles:true,cancelable:true});native.addEventListener('click',e=>{assert.equal(e.defaultPrevented,false);e.preventDefault();},{once:true});await React.act(async()=>{native.dispatchEvent(click);await tick();});assert.equal(plus.getContext().pathname,'/a');
 }finally{await React.act(async()=>root.unmount());await plus.dispose();}
});

test('Vue custom retained host presents active entries while the library owns release and DOM identity',async()=>{
 const Page={render:()=>Vue.h('input',{'data-cache':'input'})};const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:Page},{path:'/b',component:Page}]});await router.push('/a');
 const plus=RPVue.createVueRouterPlus({router,pages,globalKey:false});
 const Host=Vue.defineComponent({props:{active:Boolean},setup:(p,{slots})=>()=>Vue.h('section',{'data-host':p.active?'active':'hidden'},slots.default?.())});
 const app=Vue.createApp({render:()=>Vue.h(RPVue.RouterPlusView,{host:Host})});app.use(plus);app.mount(document.getElementById('vue'));await plus.whenReady();await Vue.nextTick();
 try{const input=document.querySelector('[data-cache]');input.value='kept';await plus.navigate('/b');await Vue.nextTick();assert.equal(document.querySelectorAll('[data-host="hidden"]').length,1);await plus.navigate('/a');await Vue.nextTick();assert.equal(document.querySelector('[data-cache]'),input);assert.equal(input.value,'kept');await plus.release();await Vue.nextTick();assert.notEqual(document.querySelector('[data-cache]'),input);}
 finally{app.unmount();await plus.dispose();}
});

test('Vue links preserve native reload behavior and suppress disabled page and external hrefs',async()=>{
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:{render:()=>null}},{path:'/b',component:{render:()=>null}}]});await router.push('/a');const plus=RPVue.createVueRouterPlus({router,pages,globalKey:false});
 let calls=0;const app=Vue.createApp({render:()=>Vue.h('div',[
  Vue.h(RPVue.RouterPlusLink,{to:'/b',reloadDocument:true,'data-vue-link':'native'},()=> 'native'),
  Vue.h(RPVue.RouterPlusLink,{to:'/b',disabled:true,'data-vue-link':'disabled'},()=> 'disabled'),
  Vue.h(RPVue.RouterPlusLink,{to:'https://outside.test',disabled:true,'data-vue-link':'external'},()=> 'external'),Vue.h(RPVue.RouterPlusLink,{to:'/b',download:false,onClick:[()=>calls++,()=>calls++],'data-vue-link':'normal'},()=> 'normal')])});app.use(plus);app.mount(document.getElementById('vue'));await plus.whenReady();
 try{for(const kind of ['disabled','external']){const link=document.querySelector(`[data-vue-link="${kind}"]`);assert.equal(link.hasAttribute('href'),false);assert.equal(link.getAttribute('aria-disabled'),'true');const event=new window.MouseEvent('click',{bubbles:true,cancelable:true});link.dispatchEvent(event);assert.equal(event.defaultPrevented,true);}
 const link=document.querySelector('[data-vue-link="native"]');link.addEventListener('click',event=>{assert.equal(event.defaultPrevented,false);event.preventDefault();},{once:true});link.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}));await Vue.nextTick();assert.equal(router.currentRoute.value.path,'/a');document.querySelector('[data-vue-link="normal"]').dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}));await tick();await plus.whenReady();assert.equal(calls,2);assert.equal(router.currentRoute.value.path,'/b');}
 finally{app.unmount();await plus.dispose();}
});

test('React tuple query writer patches selected keys and accepts native functional input shapes',async()=>{
 const plus=createRouterPlus({pages,globalKey:false}),Provider=RPReact.createReactProvider({useLocation,useNavigate});const root=createRoot(document.getElementById('react'));let write;
 function Page(){[,write]=RPReact.usePageQuery();return null;}
 try{await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/a?keep=yes&page=2#part']},React.createElement(Provider,{plus},React.createElement(Page)))));
 let receipt;await React.act(async()=>{receipt=write.patch({page:undefined,tags:['one','two'],term:''},{replace:true});await tick();});assert.equal((await receipt).ok,true);const params=new URLSearchParams(plus.getContext().search);assert.equal(params.get('keep'),'yes');assert.equal(params.has('page'),false);assert.deepEqual(params.getAll('tags'),['one','two']);assert.equal(params.get('term'),'');assert.equal(plus.getContext().hash,'#part');
 await React.act(async()=>{receipt=write(()=>({native:['one','two']}),{replace:true});await tick();});assert.equal((await receipt).ok,true);assert.deepEqual(new URLSearchParams(plus.getContext().search).getAll('native'),['one','two']);}
 finally{await React.act(async()=>root.unmount());await plus.dispose();}
});

test('Vue query patch convenience preserves unrelated keys and hash',async()=>{
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:{render:()=>null}}]});await router.push('/a?keep=yes&page=2#part');const plus=RPVue.createVueRouterPlus({router,pages,globalKey:false});let query;
 const app=Vue.createApp({setup(){query=RPVue.usePageQuery();return()=>null;}});app.use(plus);app.mount(document.getElementById('vue'));
 try{assert.equal((await query.patchQuery({page:undefined,tags:['one','two'],term:''},{replace:true})).ok,true);const params=new URLSearchParams(plus.getContext().search);assert.equal(params.get('keep'),'yes');assert.equal(params.has('page'),false);assert.deepEqual(params.getAll('tags'),['one','two']);assert.equal(params.get('term'),'');assert.equal(plus.getContext().hash,'#part');}
 finally{app.unmount();await plus.dispose();}
});

test('Data Router without native blocker capabilities still mounts and enforces Plus navigation guards',async()=>{
 const {createMemoryRouter}=await import('react-router-dom');const actual=createMemoryRouter([{path:'/a',element:React.createElement('span',null,'a')},{path:'/b',element:React.createElement('span',null,'b')}],{initialEntries:['/a']});
 const states=new WeakMap();const legacy=new Proxy(actual,{get(target,key){if(key==='getBlocker'||key==='deleteBlocker')return undefined;if(key==='state'){const state=target.state;if(!states.has(state)){const {blockers,...rest}=state;states.set(state,rest);}return states.get(state);}return Reflect.get(target,key,target);}});
 const plus=RPReact.createReactRouterPlus({router:legacy,pages,globalKey:false});const root=createRoot(document.getElementById('react'));
 try{await React.act(async()=>{root.render(React.createElement(plus.Provider));await tick();});assert.equal(plus.connected,true);const stop=plus.registerGuard({id:'deny',beforeLeave:()=>false});let result;await React.act(async()=>{result=await plus.navigate('/b');await tick();});assert.equal(result.ok,false);assert.equal(result.reason,'blocked');stop();await React.act(async()=>{result=await plus.navigate('/b');await tick();});assert.equal(result.ok,true);assert.equal(actual.state.location.pathname,'/b');}
 finally{await React.act(async()=>root.unmount());actual.dispose();await plus.dispose();}
});
