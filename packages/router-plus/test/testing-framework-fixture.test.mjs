import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
const previous=new Map();
for(const key of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver','history','location']) {
 previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
 Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
}
previous.set('IS_REACT_ACT_ENVIRONMENT',Object.getOwnPropertyDescriptor(globalThis,'IS_REACT_ACT_ENVIRONMENT'));
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {h,nextTick}=await import('vue');
const {createElement,StrictMode}=await import('react');
const {act}=await import('@testing-library/react/pure.js');
const {mountRouterPlus}=await import('@jangts/router-plus/testing/vue');
const {renderRouterPlus}=await import('@jangts/router-plus/testing/react');
const {usePageContext:useVueContext}=await import('../dist/esm/vue/index.js');
const {usePageContext:useReactContext}=await import('../dist/esm/react/index.js');
const pages=[{path:'/a',title:'A'},{path:'/b',title:'B'}];
test.after(()=>{dom.window.close();for(const [key,value] of previous) {if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
test('Vue consumer fixture updates real component and cleans independently',async()=>{
 const Component={setup(){const context=useVueContext();return()=>h('span',context.value.path);}};
 for(let i=0;i<2;i++) {
 const f=await mountRouterPlus(Component,{pages,initial:'/a',routes:pages.map(p=>({path:p.path,component:Component}))});
 try {assert.equal(f.wrapper.text(),'/a');assert.equal((await f.plus.navigate('/b')).ok,true);await nextTick();assert.equal(f.wrapper.text(),'/b');}
 finally {await f.dispose();await f.dispose();}
 }
});
test('React consumer fixture supports StrictMode and original render result',async()=>{
 function Page(){return createElement('span',null,useReactContext().path);}
 const f=await renderRouterPlus({pages,initial:'/a',ui:createElement(StrictMode,null,createElement(Page))});
 try {
 assert.equal(f.result.getByText('/a').textContent,'/a');
 const receipt=await f.run(()=>f.plus.navigate('/b'));assert.equal(receipt.ok,true);
 assert.equal(f.result.getByText('/b').textContent,'/b');
 }finally {f.result.unmount();await f.dispose();}
});
test('React data router waits for initial loader and supports redirect',async()=>{
 const {redirect}=await import('react-router-dom');
 const f=await renderRouterPlus({pages,initial:'/start',routes:[{path:'/start',loader:()=>redirect('/a')},{path:'/a',element:createElement('span',null,'loaded')},{path:'/b',element:createElement('span',null,'second')}]});
 try {assert.equal(f.plus.getContext().pathname,'/a');assert.ok(f.result.getByText('loaded'));}finally {await f.dispose();}
});
test('failed React mount releases its DOM and next fixture works',async()=>{
 function Broken(){throw new Error('consumer setup failed');}
 const before=document.body.childElementCount;
 await assert.rejects(renderRouterPlus({pages,ui:createElement(Broken),renderOptions:{onCaughtError(){}}}),/consumer setup failed/);
 assert.equal(document.body.childElementCount,before);
 const f=await renderRouterPlus({pages,ui:createElement('span',null,'recovered')});
 try{assert.ok(f.result.getByText('recovered'));}finally{await f.dispose();}
 assert.equal(document.body.childElementCount,before);
});
