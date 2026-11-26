import test from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlus} from '../dist/esm/index.js';
import {createMemoryConnection} from '../dist/esm/testing/index.js';
import {bindNativeSource} from '../dist/esm/core/native-bindings.js';
import {createStore} from 'zustand/vanilla';
import {registerZustandState} from '../dist/esm/stores/zustand.js';
const tick=()=>new Promise(r=>setTimeout(r,0));
function setup(pages=[{path:'/a'}]){const plus=createRouterPlus({pages,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));return plus;}

test('same-turn patches compose on the pending navigation value',async()=>{
 const plus=setup();let value={term:'',page:1};const stop=bindNativeSource(plus,{read:()=>value,write(next){value=next;}},{id:'filters',query:true});await plus.whenReady();
 try{await Promise.all([plus.patchState({term:'coffee'},'filters'),plus.patchState({page:2},'filters')]);await plus.whenReady();assert.deepEqual(value,{term:'coffee',page:2});}
 finally{stop();await plus.dispose();}
});

test('same-turn global field writes preserve each other',async()=>{
 const plus=setup(),store=createStore(()=>({count:0,page:1}));const stop=registerZustandState(plus,store,{id:'filters',query:true});await plus.whenReady();
 try{await Promise.all([plus.setState(7,'filters/count'),plus.setState(2,'filters/page')]);assert.deepEqual(store.getState(),{count:7,page:2});assert.equal((await plus.resetState('filters/count')).ok,true);assert.deepEqual(store.getState(),{count:0,page:2});}
 finally{stop();await plus.dispose();}
});

test('unlisted-page global restoration errors are committed failures',async()=>{
 const plus=setup([]);let value='initial';const stop=bindNativeSource(plus,{read:()=>value,write(next){if(next==='fail')throw new Error('restore failed');value=next;}},{id:'value',query:true},true);await plus.whenReady();
 try{const result=await plus.navigate('/a?value=fail');assert.equal(result.ok,false);assert.equal(result.reason,'failed');assert.equal(result.committed,true);}
 finally{stop();await plus.dispose();}
});

test('global async restorations serialize and leave the newest committed address last',async()=>{
 const plus=setup();let value='initial',unlock,started;const entered=new Promise(r=>started=r);const writes=[];
 const stop=bindNativeSource(plus,{read:()=>value,async write(next){writes.push(next);if(next==='slow'){started();await new Promise(r=>unlock=r);}value=next;}},{id:'value',query:true},true);await plus.whenReady();
 try{plus.reportLocation({pathname:'/a',search:'?value=slow',hash:''});await entered;plus.reportLocation({pathname:'/a',search:'?value=latest',hash:''});await tick();unlock();await plus.whenReady();assert.equal(value,'latest');assert.deepEqual(writes.slice(-2),['slow','latest']);}
 finally{stop();await plus.dispose();}
});

test('scoped query patches use the same pending projection',async()=>{
 const plus=setup();const scoped=plus.scope();let value={term:'',page:1};const stop=bindNativeSource(scoped,{read:()=>value,write(next){value=next;}},{id:'filters',query:true});await plus.whenReady();
 try{await Promise.all([scoped.patchState({term:'coffee'},'filters'),scoped.patchState({page:2},'filters')]);assert.deepEqual(value,{term:'coffee',page:2});}
 finally{stop();await plus.dispose();}
});

test('async non-query global field writes read the latest value inside their queue',async()=>{
 const plus=setup();let value={count:0,page:1};const stop=bindNativeSource(plus,{read:()=>value,async write(next){await tick();value=next;}},'global',true);
 try{await Promise.all([plus.setState(7,'global/count'),plus.setState(2,'global/page')]);assert.deepEqual(value,{count:7,page:2});await Promise.all([plus.patchState({count:8},'global'),plus.patchState({page:3},'global')]);assert.deepEqual(value,{count:8,page:3});}
 finally{stop();await plus.dispose();}
});

test('global restoration still runs when retention republishes the context',async()=>{
 const plus=setup([{path:'/a',retain:true}]);let value=0;const stop=bindNativeSource(plus,{read:()=>value,write(next){value=next;}},{id:'count',query:true},true);await plus.whenReady();
 try{assert.equal((await plus.navigate('/a?count=4')).ok,true);assert.equal(value,4);}
 finally{stop();await plus.dispose();}
});

test('scoped readiness waits for in-progress global address restoration',async()=>{
 const plus=setup();const scope=plus.scope();let value='initial',unlock,started;const entered=new Promise(r=>started=r);
 const stop=bindNativeSource(plus,{read:()=>value,async write(next){if(next==='slow'){started();await new Promise(r=>unlock=r);}value=next;}},{id:'value',query:true},true);await plus.whenReady();
 try{plus.reportLocation({pathname:'/a',search:'?value=slow',hash:''});await entered;let done=false;const ready=scope.whenReady().then(()=>done=true);await tick();assert.equal(done,false);unlock();await ready;assert.equal(value,'slow');}
 finally{unlock?.();stop();await plus.dispose();}
});

test('retired global restoration failures do not poison subsequent unlisted navigation',async()=>{
 const plus=setup([]);const stop=bindNativeSource(plus,{read:()=>'',write(next){if(next==='fail')throw new Error('old failure');}},{id:'value',query:true},true);await plus.whenReady();
 try{assert.equal((await plus.navigate('/a?value=fail')).ok,false);stop();assert.equal((await plus.navigate('/a?other=yes')).ok,true);}
 finally{stop();await plus.dispose();}
});

test('external navigation retires old patch proposals before the next partial update',async()=>{
 const plus=setup();let value={term:'',page:1},unlock,started;const entered=new Promise(r=>started=r);const stop=bindNativeSource(plus,{read:()=>value,write(next){value=next;}},{id:'filters',query:true});await plus.whenReady();let calls=0;
 const off=plus.registerGuard({id:'slow-old-patch',beforeLeave:()=>{if(++calls===1){started();return new Promise(r=>unlock=r);}return true;}});
 try{const first=plus.patchState({term:'old'},'filters');await entered;plus.reportLocation({pathname:'/a',search:'?term=external&page=3',hash:''});await plus.whenReady();const second=plus.patchState({page:4},'filters');unlock(true);await Promise.all([first,second]);assert.deepEqual(value,{term:'external',page:4});}
 finally{unlock?.(true);off();stop();await plus.dispose();}
});

test('page restoration queues a newer value even if it currently matches the native source',async()=>{
 const plus=setup();let value='initial',unlock,started;const entered=new Promise(r=>started=r);const stop=bindNativeSource(plus,{read:()=>value,async write(next){if(next==='slow'){started();await new Promise(r=>unlock=r);}value=next;}},{id:'value',query:true});await plus.whenReady();
 try{plus.reportLocation({pathname:'/a',search:'?value=slow',hash:''});await entered;plus.reportLocation({pathname:'/a',search:'?value=initial',hash:''});await tick();unlock();await tick();await tick();assert.equal(value,'initial');}
 finally{unlock?.();stop();await plus.dispose();}
});
