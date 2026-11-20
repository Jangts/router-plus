import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlus,toGlobalFacade} from '../dist/esm/index.js';
import {bindNativeSource,registerSourceGroup} from '../dist/esm/core/native-bindings.js';
import {createMemoryConnection} from '../dist/esm/testing/index.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){const plus=createRouterPlus({pages:[{path:'/a',title:'A'},{path:'/b',title:'B'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));return plus;}

test('source lifecycle publishes complete groups, omits rolled-back groups and unregisters once',async()=>{
 const plus=setup(),events=[];plus.subscribe(event=>{if(event.type.startsWith('state.'))events.push([event.type,event.source.id,plus.inspectState().map(item=>item.id)]);});
 assert.throws(()=>registerSourceGroup(plus,collect=>{collect(bindNativeSource(plus,{read:()=>1},'broken'));throw Error('rollback');}));assert.deepEqual(events,[]);
 const stop=registerSourceGroup(plus,collect=>{collect(bindNativeSource(plus,{read:()=>1},'one'));collect(bindNativeSource(plus,{read:()=>2},'two'));});
 assert.deepEqual(events.slice(0,2),[['state.registered','one',['one','two']],['state.registered','two',['one','two']]]);stop();stop();assert.deepEqual(events.slice(2).map(item=>item.slice(0,2)),[['state.unregistered','two'],['state.unregistered','one']]);await plus.dispose();
});

test('group waits for conditional panel/form registration and publication before submitting',async()=>{
 const plus=setup();let form={name:''},seen,settles=0;
 bindNativeSource(plus,{read:()=>false,write(open){if(open)queueMicrotask(()=>bindNativeSource(plus,{read:()=>form,write(next){form=next;},whenSettled(){settles++;}},'form'));}},'panel');
 bindNativeSource(plus,{read:()=>null,call(){seen=form.name;return 'saved';}},'save');
 const result=await toGlobalFacade(plus).execute([{kind:'state.set',key:'panel',value:true},{kind:'state.patch',key:'form',value:{name:'Ivan'}},{kind:'state.call',id:'save'}]);assert.equal(result.ok,true);assert.equal(result.results.length,3);assert.equal(result.results[2].value,'saved');assert.equal(seen,'Ivan');assert.ok(settles>=1);await plus.dispose();
});

test('group navigates into the new scope and never borrows a same-ID source from the old page',async()=>{
 const plus=setup();let old=0,next=0;bindNativeSource(plus,{read:()=>old,write(value){old=value;}},'form');
 const pending=plus.execute([{kind:'navigate',target:'/b'},{kind:'state.set',key:'form',value:9}]);await tick();assert.equal(plus.getContext().pathname,'/b');bindNativeSource(plus,{read:()=>next,write(value){next=value;}},'form');const result=await pending;assert.equal(result.ok,true);assert.equal(old,0);assert.equal(next,9);await plus.dispose();
});

test('timeouts and aborts remove waits and never replay a command when a source later appears',async()=>{
 const plus=setup();let writes=0;const timeout=await plus.execute([{kind:'state.set',key:'missing',value:1}],{timeoutMs:5});assert.equal(timeout.reason,'timeout');assert.equal(timeout.failedIndex,0);
 const controller=new AbortController();const pending=plus.execute([{kind:'state.set',key:'missing',value:1}],{signal:controller.signal});controller.abort();assert.equal((await pending).reason,'cancelled');bindNativeSource(plus,{read:()=>0,write(){writes++;}},'missing');await tick();assert.equal(writes,0);await plus.dispose();
});

test('navigation, source replacement and disposal cancel active groups without undoing issued calls',async()=>{
 const plus=setup();const waiting=plus.execute([{kind:'state.set',key:'missing',value:1}]);await plus.navigate('/b');assert.equal((await waiting).reason,'cancelled');
 let finish,calls=0,after=0;const stop=bindNativeSource(plus,{read:()=>null,call(){calls++;return new Promise(resolve=>finish=resolve);}},'save');bindNativeSource(plus,{read:()=>null,call(){after++;}},'after');const running=plus.execute([{kind:'state.call',id:'save'},{kind:'state.call',id:'after'}]);await tick();stop();bindNativeSource(plus,{read:()=>null,call(){throw Error('replacement');}},'save');assert.equal((await running).reason,'cancelled');finish('late');await tick();assert.equal(calls,1);assert.equal(after,0);
 const disposed=plus.execute([{kind:'state.read',key:'never'}]);await plus.dispose();assert.equal((await disposed).reason,'cancelled');
});

test('groups stop on failure and preserve completed receipts including publication failures',async()=>{
 const plus=setup();let calls=0;bindNativeSource(plus,{read:()=>1},'readonly');bindNativeSource(plus,{read:()=>null,call(){calls++;}},'save');let result=await plus.execute([{kind:'state.read',key:'readonly'},{kind:'state.set',key:'readonly',value:2},{kind:'state.call',id:'save'}]);assert.equal(result.reason,'state-readonly');assert.equal(result.failedIndex,1);assert.equal(result.results.length,2);assert.equal(calls,0);
 let publications=0;bindNativeSource(plus,{read:()=>1,write(){},whenSettled(){if(++publications===2)throw Error('publication');}},'broken');result=await plus.execute([{kind:'state.set',key:'broken',value:2},{kind:'state.call',id:'save'}]);assert.equal(result.reason,'failed');assert.equal(result.failedIndex,0);assert.equal(result.results[0].ok,true);assert.equal(calls,0);await plus.dispose();
});

test('groups resolve Store field paths and scoped subscriptions filter lifecycle events',async()=>{
 const plus=setup(),scope=plus.scope(),events=[];scope.subscribe(event=>{if(event.type==='state.registered')events.push(event.source.id);});let value={name:''};bindNativeSource(plus,{read:()=>value,write(next){value=next;}},'form');
 // Field paths are indexed for global Stores; exact page bindings remain exact IDs.
 bindNativeSource(plus,{read:()=>value,write(next){value=next;}},'store',true);assert.equal((await plus.execute([{kind:'state.set',key:'store/name',value:'Ivan'}])).ok,true);assert.equal(value.name,'Ivan');await plus.navigate('/b');bindNativeSource(plus,{read:()=>1},'other');assert.deepEqual(events,['form','store']);await plus.dispose();
});

test('scoped groups can leave their own scope and follow redirects without being cancelled by release',async()=>{
 const plus=setup(),scope=plus.scope();let value=0;const pending=scope.execute([{kind:'navigate',target:'/b'},{kind:'state.set',key:'form',value:4}]);await tick();bindNativeSource(plus,{read:()=>value,write(next){value=next;}},'form');assert.equal((await pending).ok,true);assert.equal(value,4);await plus.dispose();
});

test('leaving during afterEnter cannot redirect the remainder of a group to an unrelated page',async()=>{
 let entering,release;const arrived=new Promise(resolve=>entering=resolve);const plus=createRouterPlus({pages:[{path:'/a',title:'A'},{path:'/b',title:'B',guards:{async afterEnter(){entering();await new Promise(resolve=>release=resolve);}}},{path:'/c',title:'C'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const pending=plus.execute([{kind:'navigate',target:'/b'},{kind:'state.read',key:'never'}]);await arrived;await plus.navigate('/c');release();assert.equal((await pending).reason,'cancelled');await plus.dispose();
});
