import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from 'zustand/vanilla';
import {configureStore} from '@reduxjs/toolkit';
import {atom,createStore as atomStore} from 'jotai/vanilla';
import {createRouterPlus} from '../dist/esm/index.js';
import {createMemoryConnection} from '../dist/esm/testing/index.js';
import {registerZustandState} from '../dist/esm/stores/zustand.js';
import {registerReduxState,configureRpReduxStore} from '../dist/esm/stores/redux.js';
import {registerJotaiState,createRpJotaiAtom} from '../dist/esm/stores/jotai.js';
import {bindNativeSource} from '../dist/esm/core/native-bindings.js';
function setup(options={}) {const plus=createRouterPlus({pages:[{path:'/a',title:'A'}],globalKey:false,...options});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?count=3'}}));return plus;}

test('existing Zustand sources preserve merge, latest receivers and aggregate cleanup',async()=>{
 const plus=setup(),store=createStore(()=>({count:0,inc(){return this.count+1;}}));const get=store.getState,set=store.setState,subscribe=store.subscribe;
 const stop=registerZustandState(plus,store,{id:'counter',fields:{count:{query:true}}});await plus.whenReady();assert.equal(store.getState().count,3);
 assert.equal((await plus.callState('counter/inc')).value,4);store.setState({inc(){return this.count+10;}});assert.equal((await plus.callState('counter/inc')).value,13);
 await plus.setState(7,'counter/count');assert.equal(store.getState().count,7);assert.equal(typeof store.getState().inc,'function');
 store.setState({added:()=>99});assert.equal((await plus.callState('counter/added')).reason,'state-unknown');
 store.setState({inc:undefined});assert.equal((await plus.callState('counter/inc')).reason,'failed');
 stop();stop();assert.equal(plus.getState('counter'),undefined);assert.equal(plus.getState('counter/inc'),undefined);assert.equal(get,store.getState);assert.equal(set,store.setState);assert.equal(subscribe,store.subscribe);await plus.dispose();
});

test('registration rollback removes rules and subscriptions without QS writes',async()=>{
 const plus=setup(),store=createStore(()=>({count:0,inc:()=>1}));let subscriptions=0;
 const wrapped={...store,subscribe(listener){subscriptions++;const stop=store.subscribe(listener);return()=>{subscriptions--;stop();};}};
 const other=registerJotaiState(plus,atomStore(),atom(1),'counter/inc');
 assert.throws(()=>registerZustandState(plus,wrapped,{id:'counter',fields:{count:{query:true}}}),/Duplicate/);
 assert.equal(subscriptions,0);assert.equal(plus.getState('counter'),undefined);assert.equal(plus.getState('counter/inc'),1);assert.equal(store.getState().count,0);assert.equal(plus.pages.get('/a').states.counter,undefined);
 other();await plus.dispose();
});

test('single-source subscribe failures undo index and page metadata, including immediate notifications',async()=>{
 const plus=setup(),events=[];plus.subscribe(event=>{if(event.type==='state')events.push(event);});
 const error=new Error('subscribe failed');
 assert.throws(()=>bindNativeSource(plus,{read:()=>0,write(){},subscribe(listener){listener();throw error;}},{id:'bad',query:'count'},true),value=>value===error);
 assert.equal(plus.getState('bad'),undefined);assert.equal(plus.pages.get('/a').states.bad,undefined);assert.equal(events.length,0);
 assert.throws(()=>bindNativeSource(plus,{read:()=>0,write(){},subscribe(){throw error;}},{id:'local',query:'count'}),value=>value===error);
 assert.equal(plus.getState('local'),undefined);assert.equal(plus.pages.get('/a').states.local,undefined);await plus.dispose();
});

test('cleanup failures do not stop aggregate unregistration or owner disposal',async()=>{
 const errors=[],plus=setup({onDiagnostic:(error,stage)=>errors.push(stage)}),store=createStore(()=>({count:0,inc:()=>1}));let detached=0;
 const wrapped={...store,subscribe(listener){const stop=store.subscribe(listener);return()=>{detached++;stop();throw new Error('stop failed');};}};
 const release=registerZustandState(plus,wrapped,'counter');release();release();assert.equal(detached,1);assert.equal(plus.getState('counter/inc'),undefined);assert.ok(errors.includes('state.cleanup'));
 const release2=registerZustandState(plus,wrapped,'counter');await plus.dispose();release2();assert.equal(detached,2);
});

test('Redux existing registration is readonly unless it dispatches an explicit business setter',async()=>{
 const plus=setup(),store=configureStore({reducer:(state={count:0},action)=>action.type==='business/set'?{count:action.payload}:state});const replace=store.replaceReducer,dispatch=store.dispatch;
 let stop=registerReduxState(plus,store,'counter');assert.equal((await plus.setState({count:8},'counter')).reason,'state-readonly');assert.equal(store.getState().count,0);
 assert.equal((await plus.callState('counter/dispatch',{type:'business/set',payload:2})).ok,true);assert.equal(store.getState().count,2);stop();
 assert.throws(()=>registerReduxState(plus,store,{id:'readonly',query:true}),/Readonly/);
 stop=registerReduxState(plus,store,{id:'counter',set:next=>{store.dispatch({type:'business/set',payload:next.count});},fields:{count:{query:true}}});await plus.whenReady();assert.equal(store.getState().count,3);
 await plus.setState(9,'counter/count');assert.equal(store.getState().count,9);assert.equal(store.replaceReducer,replace);assert.equal(store.dispatch,dispatch);stop();await plus.dispose();
});

test('Redux creation uses a supplied business setter instead of injecting a reducer writer',async()=>{
 const plus=setup();let seen=0;const store=configureRpReduxStore(plus,configureStore)({reducer:(state={count:0},action)=>{seen++;return action.type==='set'?{count:action.payload}:state;}},{id:'counter',set:next=>{store.dispatch({type:'set',payload:next.count});}});
 const before=seen;await plus.setState({count:5},'counter');assert.equal(store.getState().count,5);assert.equal(seen,before+1);await plus.dispose();
});

test('Jotai commands, primitive assignment and explicit assignment adapters remain distinct',async()=>{
 const plus=setup(),store=atomStore(),value=atom(0),command=atom(get=>get(value),(get,set,delta,multiplier)=>{set(value,get(value)+delta*multiplier);return get(value);});
 let stop=registerJotaiState(plus,store,command,'command');assert.equal((await plus.setState(9,'command')).reason,'state-readonly');assert.equal((await plus.callState('command',2,3)).value,6);assert.equal(store.get(value),6);stop();
 stop=registerJotaiState(plus,store,command,{id:'command',set:next=>{store.set(command,next-store.get(value),1);}});await plus.setState(10,'command');assert.equal(store.get(value),10);stop();
 const primitiveStop=registerJotaiState(plus,store,value,'existing');assert.equal((await plus.setState(11,'existing')).reason,'state-readonly');primitiveStop();
 const create=createRpJotaiAtom(plus,atom,store),primitive=create(1,'created');await plus.setState(12,'created');assert.equal(store.get(primitive),12);
 const createdCommand=create(get=>get(value),(get,set,delta)=>{set(value,get(value)+delta);},'createdCommand');assert.equal((await plus.setState(99,'createdCommand')).reason,'state-readonly');await plus.callState('createdCommand',1);assert.equal(store.get(value),11);assert.ok(createdCommand);await plus.dispose();
});

test('unregistering invalidates async command and setter results without replacing the source',async()=>{
 const plus=setup();let finish;const pending=new Promise(resolve=>finish=resolve),store=configureStore({reducer:(state={count:0})=>state});
 const stop=registerReduxState(plus,store,{id:'counter',set:()=>pending});const write=plus.setState({count:1},'counter');stop();finish();assert.equal((await write).reason,'cancelled');
 let finishCall;const wait=new Promise(resolve=>finishCall=resolve);const atomSource=atom(()=>0,async()=>{await wait;return 7;});const release=registerJotaiState(plus,atomStore(),atomSource,'call');const call=plus.callState('call');release();finishCall();assert.equal((await call).reason,'cancelled');await plus.dispose();
});

test('Jotai existing atoms stay isolated by store and preserve async command results',async()=>{
 const plus=setup(),a=atomStore(),b=atomStore(),value=atom(0),command=atom(get=>get(value),async(get,set,delta,label)=>{await Promise.resolve();set(value,get(value)+delta);return label;});
 const stopA=registerJotaiState(plus,a,command,'a'),stopB=registerJotaiState(plus,b,command,'b');assert.equal((await plus.callState('a',4,'done')).value,'done');assert.equal(plus.getState('a'),4);assert.equal(plus.getState('b'),0);stopA();stopB();await plus.dispose();
 assert.throws(()=>registerJotaiState(plus,a,value,'retired'),/disposed/);
});

test('a diagnostic sink cannot replace the original subscription failure',async()=>{
 const failure=new Error('original'),plus=setup({onDiagnostic(){throw new Error('sink');}});
 assert.throws(()=>bindNativeSource(plus,{read:()=>0,subscribe(){throw failure;}},'broken',true),error=>error===failure);assert.equal(plus.getState('broken'),undefined);await plus.dispose();
});

test('Jotai onMount changes do not overwrite query restoration during registration',async()=>{
 const plus=setup(),store=atomStore(),value=atom(0);value.onMount=set=>{set(1);};
 const stop=registerJotaiState(plus,store,value,{id:'count',query:true,set:next=>{store.set(value,next);}});await plus.whenReady();assert.equal(store.get(value),3);assert.equal(new URLSearchParams(plus.getContext().search).get('count'),'3');stop();await plus.dispose();
});

test('unregistering a query source cancels the pending state receipt after the native commit',async()=>{
 const plus=setup(),store=configureStore({reducer:(state={count:0},action)=>action.type==='set'?{count:action.payload}:state});let begin,finish;const started=new Promise(resolve=>begin=resolve),pending=new Promise(resolve=>finish=resolve);
 const stop=registerReduxState(plus,store,{id:'counter',fields:{count:{query:true}},set:async next=>{if(next.count===9){begin();await pending;}store.dispatch({type:'set',payload:next.count});}});await plus.whenReady();
 const write=plus.setState({count:9},'counter');await started;stop();finish();const result=await write;assert.equal(result.reason,'cancelled');assert.equal(result.committed,true);await plus.dispose();
});

test('global query ownership conflicts are rejected even without catalog pages',async()=>{
 const plus=createRouterPlus({pages:[],globalKey:false}),store=createStore(()=>0);
 const stop=registerZustandState(plus,store,{id:'first',query:'count'});
 assert.throws(()=>registerZustandState(plus,store,{id:'second',query:'count'}),/Duplicate global query ownership/);
 assert.equal(plus.getState('first'),0);assert.equal(plus.getState('second'),undefined);stop();await plus.dispose();
});

test('a retired page source cancels a late rejected setter without replacing the new source',async()=>{
 const plus=setup();let reject,begin;const pending=new Promise((resolve,fail)=>reject=fail),started=new Promise(resolve=>begin=resolve);
 const owner=plus.scope(plus.getContext());const stop=bindNativeSource(owner,{read:()=>0,write(){begin();return pending;}},'local');
 const write=owner.setState(1,'local');await started;stop();const replacement=bindNativeSource(owner,{read:()=>2,write(){}},'local');reject(new Error('late failure'));
 assert.equal((await write).reason,'cancelled');assert.equal(owner.getState('local'),2);replacement();await plus.dispose();
});

test('retired query-writer failures do not poison replacement global or page sources',async()=>{
 for(const global of [true,false]){
  const plus=setup();let begin,reject;const started=new Promise(resolve=>begin=resolve),pending=new Promise((resolve,fail)=>reject=fail);let value=0;
  const owner=global?plus:plus.scope(plus.getContext());const old=bindNativeSource(owner,{read:()=>value,write(next){if(next===9){begin();return pending;}value=next;}},{id:'value',query:'count'},global);await plus.whenReady();
  const write=owner.setState(9,'value');await started;old();const replacement=bindNativeSource(owner,{read:()=>value,write(next){value=next;}},{id:'value',query:'count'},global);reject(new Error('retired restore'));
  assert.equal((await write).reason,'cancelled');assert.equal((await plus.navigate('/a?count=4')).ok,true);assert.equal(value,4);replacement();await plus.dispose();
 }
});

test('ready binding cleanup continues after a native unsubscriber throws',async()=>{
 const errors=[],plus=setup({onDiagnostic:(_,stage)=>errors.push(stage)});let detached=0;
 const store=createStore(()=>({count:0}));const wrapped={...store,subscribe(listener){const stop=store.subscribe(listener);return()=>{detached++;stop();throw new Error('cleanup');};}};
 const stop=registerZustandState(plus,wrapped,{id:'pending',query:true,ready:()=>false});
 stop();assert.equal(detached,2);assert.equal(plus.inspectState('pending'),null);assert.equal(plus.pages.get('/a').states.pending,undefined);assert.ok(errors.includes('state.cleanup'));await plus.dispose();
});

test('global query bindings restore and update even outside the page catalog',async()=>{
 const plus=createRouterPlus({pages:[],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/unlisted',search:'?count=3&keep=yes',hash:'#part'}}));
 const store=createStore(()=>({count:0}));const stop=registerZustandState(plus,store,{id:'counter',query:true,omitDefault:true});
 try{await plus.whenReady();assert.equal(store.getState().count,3);assert.equal((await plus.setState(4,'counter/count')).ok,true);await plus.whenReady();assert.equal(new URLSearchParams(plus.getContext().search).get('count'),'4');assert.equal(plus.getContext().hash,'#part');assert.equal(new URLSearchParams(plus.getContext().search).get('keep'),'yes');}
 finally{stop();await plus.dispose();}
});
