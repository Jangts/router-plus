import test from 'node:test';import assert from 'node:assert/strict';
import {createStore} from 'zustand/vanilla';import {createRouterPlus} from '../dist/esm/index.js';
import {registerZustandState,createRpZustand} from '../dist/esm/stores/zustand.js';import {createMemoryConnection} from '../dist/esm/testing/index.js';
test('R04 native Zustand roots retain their data, identity and native replacement shape',async()=>{
 for(const [initial,next] of [[new Map([['a',1]]),new Map([['b',2]])],[new Set([1]),new Set([2])],[new Date(0),new Date(1)],[[1,2],[3]],[1,2]]){
  const plus=createRouterPlus({pages:[],globalKey:false}),store=createStore(()=>initial);const set=store.setState,get=store.getState;const stop=registerZustandState(plus,store,'root');
  try{assert.equal(plus.getState('root'),initial);assert.equal((await plus.setState(next,'root')).ok,true);assert.equal(store.getState(),next);assert.equal(plus.getState('root'),next);assert.equal(store.getState,get);assert.equal(store.setState,set);}finally{stop();await plus.dispose();}
 }
});
test('R04 root collections restore query codecs without becoming empty records',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?selected=b'}}));const store=createRpZustand(plus,createStore)(()=>new Set(['a']),{id:'selected',query:'selected',encode:s=>[...s].join(','),decode:q=>new Set((q.get('selected')??'a').split(','))});
 try{await plus.whenReady();assert.ok(store.getState() instanceof Set);assert.deepEqual([...store.getState()],['b']);await plus.setState(new Set(['c']),'selected');assert.deepEqual([...store.getState()],['c']);assert.equal(plus.getContext().search,'?selected=c');}finally{await plus.dispose();}
});
test('R04 record writes still preserve actions and unsupported class roots fail before mutation',async()=>{
 const plus=createRouterPlus({pages:[],globalKey:false});const action=()=>1,store=createStore(()=>({count:1,action}));const stop=registerZustandState(plus,store,'record');
 try{await plus.setState({count:2},'record');assert.equal(store.getState().action,action);class Custom{value=1;}const initial=new Custom(),unsupported=createStore(()=>initial);assert.throws(()=>registerZustandState(plus,unsupported,'custom'),/plain record/);assert.equal(unsupported.getState(),initial);assert.equal(plus.inspectState('custom'),null);}finally{stop();await plus.dispose();}
});
