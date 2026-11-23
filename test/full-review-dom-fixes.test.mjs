import test from 'node:test';
import assert from 'node:assert/strict';
import {installHistoryBridge} from '../dist/esm/dom/history.js';
import {createDomRuntime} from '../dist/esm/dom/targets.js';
function historyScope(){const listeners=new Set();let nativeCalls=0;const history={pushState(){nativeCalls++;return 17;},replaceState(){nativeCalls++;return 23;}};return{history,location:{pathname:'/a',search:'',hash:''},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),get calls(){return nativeCalls;},listeners};}
test('history bridge preserves later wrappers and retired wrappers never report into a new installation',()=>{
 const scope=historyScope();let old=0,newCalls=0;const off=installHistoryBridge({reportLocation(){old++;}},scope);const wrappedPush=scope.history.pushState,wrappedReplace=scope.history.replaceState;
 const foreignPush=function(...args){return wrappedPush.apply(this,args);},foreignReplace=function(...args){return wrappedReplace.apply(this,args);};scope.history.pushState=foreignPush;scope.history.replaceState=foreignReplace;
 off();assert.equal(scope.history.pushState,foreignPush);assert.equal(scope.history.replaceState,foreignReplace);assert.equal(scope.listeners.size,0);assert.equal(scope.history.pushState({},'', '/b'),17);assert.equal(old,0);
 const newOff=installHistoryBridge({reportLocation(){newCalls++;}},scope);scope.history.pushState({},'', '/c');assert.equal(newCalls,1);assert.equal(old,0);scope.history.replaceState({},'', '/d');assert.equal(newCalls,2);newOff();assert.equal(scope.history.pushState,foreignPush);scope.history.pushState({},'', '/e');assert.equal(newCalls,2);assert.equal(scope.calls,4);
});
test('one failing history observer cannot change native results or starve healthy observers',()=>{
 const scope=historyScope();let healthy=0;const off=installHistoryBridge({reportLocation(){throw Error('observer');}},scope);const offHealthy=installHistoryBridge({reportLocation(){healthy++;}},scope);
 assert.equal(scope.history.pushState({},'', '/b'),17);assert.equal(scope.history.replaceState({},'', '/c'),23);for(const listener of scope.listeners)listener();assert.equal(healthy,3);off();offHealthy();assert.equal(scope.listeners.size,0);
 const boom=new Error('native');scope.history.pushState=()=>{throw boom;};const stop=installHistoryBridge({reportLocation(){healthy++;}},scope);assert.throws(()=>scope.history.pushState({},''),e=>e===boom);assert.equal(healthy,3);stop();
});
function scroll(rect,options={},metrics={}){let actual;const container={getBoundingClientRect:()=>({top:0,left:0,bottom:100,right:100,height:100,width:100}),scrollBy:value=>actual=value,...metrics};createDomRuntime({root:{querySelector(){return container;}}}).scroll({getBoundingClientRect:()=>rect},{container,block:'nearest',...options});return actual;}
function rect(top,bottom,left=0,right=20){return{top,bottom,left,right,height:bottom-top,width:right-left};}
test('nearest scrolling chooses the nearest edge on both axes and preserves visible/spanning targets',()=>{
 assert.deepEqual(scroll(rect(150,170,150,170)),{top:70,left:70,behavior:'auto'});
 assert.deepEqual(scroll(rect(-50,-30,-50,-30)),{top:-50,left:-50,behavior:'auto'});
 assert.equal(scroll(rect(20,40)).top,0);assert.equal(scroll(rect(-20,120)).top,0);
 assert.equal(scroll(rect(-150,50)).top,-50);assert.equal(scroll(rect(50,250)).top,50);
 assert.equal(scroll(rect(0,100)).top,0);
});
test('container alignment honors inline, offsets and the inner border viewport',()=>{
 assert.deepEqual(scroll(rect(150,170,150,170),{block:'center',inline:'center'}),{top:110,left:110,behavior:'auto'});
 assert.deepEqual(scroll(rect(150,170,150,170),{offset:10,inline:'end'}),{top:140,left:70,behavior:'auto'});
 assert.deepEqual(scroll(rect(150,170,150,170),{block:'end',inline:'start'}),{top:70,left:150,behavior:'auto'});
 assert.deepEqual(scroll(rect(90,110,90,110),{}, {clientTop:5,clientLeft:5,clientHeight:80,clientWidth:80}),{top:25,left:25,behavior:'auto'});
});
test('inline start and end follow a right-to-left container',()=>{
 const rtl={ownerDocument:{defaultView:{getComputedStyle:()=>({direction:'rtl'})}}};
 assert.equal(scroll(rect(0,20,150,170),{inline:'start'},rtl).left,70);
 assert.equal(scroll(rect(0,20,150,170),{inline:'end'},rtl).left,150);
});
