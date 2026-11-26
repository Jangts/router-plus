import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/a',pretendToBeVisual:true});
for(const key of ['window','document','Element','HTMLElement','SVGElement','Node','history','location'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
const {createApp,h,nextTick}=await import('vue');
const {createRouter,createMemoryHistory,useRoute}=await import('vue-router');
const {createRouterPlus}=await import('../dist/esm/index.js');
const {createVueRouterPlus,RouterPlusView,usePageContext}=await import('../dist/esm/vue/index.js');
const {usePageState}=await import('../dist/esm/vue/composables.js');

test('real Vue cached views keep route and state scoped and restore history tabs',async()=>{
const pages=[{id:'a',path:'/a',title:'A',retain:true,tabs:[{id:'one'},{id:'two'}],state:{initial:{v:1}}},{id:'b',path:'/b',title:'B',retain:true,state:{initial:{v:2}}}];
 const readings={},writers={},mounts={};
 const component=(id)=>({setup(){mounts[id]=(mounts[id]??0)+1;const state=usePageState();const context=usePageContext();const route=useRoute();writers[id]=state;return()=>{readings[id]={value:state.state.value.v,path:context.value.path,route:route.path};return h('div',null,[h('span',null,String(state.state.value.v)),h('input',{'data-page':id})]);};}});
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:component('a')},{path:'/b',component:component('b')}]});await router.push('/a');
 const plus=createRouterPlus({pages,globalKey:false});const plugin=createVueRouterPlus({plus,router});
 const app=createApp({render:()=>h(RouterPlusView)});app.use(router);app.use(plugin);app.mount(document.getElementById('root'));await nextTick();
 const original=document.querySelector('[data-page="a"]');original.value='retained';
 assert.equal((await plus.setTab('two')).ok,true);await nextTick();
 assert.equal(plus.getTab(),'two');await plus.navigate('/b');await nextTick();
 writers.a.set({v:9});await nextTick();await plus.whenReady();await nextTick();
 assert.equal(readings.a.path,'/a');assert.equal(readings.a.route,'/a');assert.equal(readings.b.value,2);
 assert.equal((await plus.back()).ok,true);await nextTick();assert.equal(plus.getTab(),'two');assert.equal(readings.a.value,9);assert.equal(document.querySelector('[data-page="a"]'),original);assert.equal(original.value,'retained');assert.equal(mounts.a,1);
 app.unmount();await plus.dispose();
});

test('Vue tab selectors preserve concrete dynamic instances and their address',async()=>{
 const {usePageTab}=await import('../dist/esm/vue/composables.js');const pages=[{id:'detail',path:'/alpha/:id',title:'Alpha',tabs:[{id:'one'},{id:'two'}]}];
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/alpha/:id',component:{}}]});await router.push('/alpha/first');
 const plus=createRouterPlus({pages,globalKey:false});const plugin=createVueRouterPlus({plus,router});let tabs;
 const app=createApp({setup(){tabs=usePageTab('/alpha/second?x=1#mark');return()=>h('span',null,tabs.tab.value);}});app.use(router);app.use(plugin);app.mount(document.getElementById('root'));
 await plus.setTab('two');await nextTick();assert.equal(tabs.tab.value,'one');
 tabs.setTab('two');await new Promise(r=>setTimeout(r,0));await nextTick();assert.equal(plus.getContext().path,'/alpha/second?x=1#mark');assert.equal(plus.getTab(),'two');
 tabs.setTab('one');await new Promise(r=>setTimeout(r,0));assert.equal(plus.getContext().params.id,'second');assert.equal(plus.getTab(),'one');
 app.unmount();await plus.dispose();
});

test('Vue state subscribers rerender for in-place plain-object bridge notifications',async()=>{
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:{}}]});await router.push('/a');const plus=createRouterPlus({pages:[{path:'/a',title:'A'}],globalKey:false});const plugin=createVueRouterPlus({plus,router});
 const state={count:0};let notify;plugin.install({use(){},provide(){},config:{globalProperties:{}}});plus.registerStateBridge('plain',{read:()=>state,subscribe(fn){notify=fn;return()=>{};}});
 const app=createApp({setup(){const value=usePageState('plain');return()=>h('span',null,String(value.state.value.count));}});app.use(plugin);app.mount(document.getElementById('root'));assert.equal(document.getElementById('root').textContent,'0');
 state.count=7;notify();await nextTick();assert.equal(document.getElementById('root').textContent,'7');app.unmount();await plus.dispose();
});

test('assembled Vue instance installs native router and Plus through one app.use',async()=>{
 const {useRouterPlus}=await import('../dist/esm/vue/index.js');let observed;
 const Page={setup(){observed=useRouterPlus();const route=useRoute();return()=>h('span',null,route.path);}};
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:Page},{path:'/b',component:Page}]});await router.push('/a');
 const plus=createVueRouterPlus({router,pages:[{path:'/a',title:'A'},{path:'/b',title:'B'}],globalKey:false});
 const app=createApp({render:()=>h(RouterPlusView)});app.use(plus);app.mount(document.getElementById('root'));await nextTick();
 assert.equal(observed.getContext().pathname,'/a');assert.equal((await plus.navigate('/b')).ok,true);await nextTick();assert.equal(document.getElementById('root').textContent,'/b');
 app.unmount();assert.equal(plus.connected,false);await plus.dispose();
});

test('Vue overlay reacts to theme changes without replacing the active renderer',async()=>{
 const {ref}=await import('vue');const {RouterPlusOverlay}=await import('../dist/esm/vue/index.js');const theme=ref({zIndex:30,highlightPadding:8});
 const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:{}}]});await router.push('/a');
 const plus=createVueRouterPlus({router,pages:[{path:'/a',title:'A'}],globalKey:false});const app=createApp({render:()=>h(RouterPlusOverlay,{theme:theme.value})});app.use(plus);app.mount(document.getElementById('root'));await nextTick();await plus.whenReady();
 const rect={left:0,top:0,right:20,bottom:20,width:20,height:20};await plus.highlight({rect:()=>rect},{spotlight:true});await new Promise(r=>setTimeout(r,25));
 const overlay=document.querySelector('.rp-overlay-root'),highlight=plus.getHighlight();theme.value={zIndex:12};await nextTick();
 assert.equal(document.querySelector('.rp-overlay-root'),overlay);assert.equal(plus.getHighlight(),highlight);assert.equal(overlay.style.getPropertyValue('--rp-z-index'),'12');assert.equal(overlay.style.getPropertyValue('--rp-highlight-padding'),'');app.unmount();assert.equal(document.querySelector('.rp-overlay-root'),null);await plus.dispose();
});

test('Vue highlight component receives measured props and retains App injection',async()=>{
 const {inject,shallowRef,onUnmounted}=await import('vue');const {RouterPlusOverlay}=await import('../dist/esm/vue/index.js');const key=Symbol('brand');let received,unmounted=0;
 const AppHighlight={props:['width','height','left','top','context'],setup(props){const brand=inject(key),route=useRoute();onUnmounted(()=>unmounted++);return()=>{received=props;return h('i',{class:'app-vue-highlight',style:{width:'100%',height:'100%',borderRadius:'3px'}},brand+route.path);};}};
 const component=shallowRef(AppHighlight);const router=createRouter({history:createMemoryHistory(),routes:[{path:'/a',component:{}}]});await router.push('/a');const plus=createVueRouterPlus({router,pages:[{path:'/a',title:'A'}],globalKey:false});
 const app=createApp({render:()=>h(RouterPlusOverlay,{highlightComponent:component.value})});app.provide(key,'App');app.use(plus);app.mount(document.getElementById('root'));await nextTick();await plus.whenReady();
 document.querySelector('.rp-overlay-highlight').getBoundingClientRect=()=>({left:4,top:4,width:72,height:32});const target={left:10,top:10,width:60,height:20,right:70,bottom:30};await plus.highlight({rect:()=>target},{spotlight:true,placement:'right-top'});await new Promise(r=>setTimeout(r,35));await nextTick();
 assert.deepEqual([received.width,received.height,received.left,received.top],[72,32,4,4]);assert.equal(received.context.page.pathname,'/a');assert.equal(received.context.targetRect.width,60);assert.equal(document.querySelector('.app-vue-highlight').textContent,'App/a');assert.equal(document.querySelector('.rp-overlay-tip').hidden,true);
 component.value=undefined;await nextTick();assert.equal(document.querySelector('.app-vue-highlight'),null);assert.equal(unmounted,1);assert.equal(document.querySelector('.rp-overlay-spotlight').hidden,false);app.unmount();await plus.dispose();
});
