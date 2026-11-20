import { test } from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlus} from '../dist/esm/index.js';
import {createMemoryConnection} from '../dist/esm/testing/index.js';
import {encodeQuery,decodeQuery,queryKeys} from '../dist/esm/core/state-fields.js';

function router(initial={pathname:'/a',search:'',hash:''}) {
 const plus=createRouterPlus({pages:[{path:'/a',title:'A'},{path:'/b',title:'B'}],globalKey:false});
 plus.connect(createMemoryConnection({initial}));return plus;
}

test('query groups expand once and fields keep objects/arrays as complete JSON values',()=>{
 const field={default:{category:'all',range:{from:1},tags:['a'],draft:'keep'},fields:{category:{query:true,values:['all','code']},range:{query:true},tags:{query:true}}};
 assert.deepEqual(queryKeys('filter',field),['category','range','tags']);
 const encoded=encodeQuery('filter',field,{category:'code',range:{from:2},tags:['a','b'],draft:'private'});
 assert.equal(encoded.get('range'),'{"from":2}');assert.equal(encoded.get('tags'),'["a","b"]');assert.equal(encoded.has('draft'),false);
 const restored=decodeQuery('filter',field,encoded,{category:'all',range:{from:1},tags:[],draft:'typed'});
 assert.deepEqual(restored,{category:'code',range:{from:2},tags:['a','b'],draft:'typed'});
 assert.throws(()=>decodeQuery('filter',field,new URLSearchParams('tags=a&tags=b')),/Duplicate/);
});

test('custom whole-group codecs preserve repeated values and enforce parameter ownership',()=>{
 const field={default:{tags:[],page:1},query:['tags','p'],encode:value=>({tags:value.tags,p:String(value.page)}),groupDecode:query=>({tags:query.getAll('tags'),page:Number(query.get('p')??1)})};
 assert.equal(encodeQuery('filter',field,{tags:['a','b'],page:2}).toString(),'tags=a&tags=b&p=2');
 assert.deepEqual(decodeQuery('filter',field,new URLSearchParams('tags=a&tags=b&p=2&secret=x')),{tags:['a','b'],page:2});
 assert.throws(()=>encodeQuery('filter',{...field,encode:()=>({extra:'bad'})},{}),/unowned/);
 assert.equal(encodeQuery('filter',field,{tags:[],page:1}).has('tags'),false);
});

test('native store factories create and register real Zustand stores in one operation',async()=>{
 const {createStore}=await import('zustand/vanilla');
 const {createRpZustand}=await import('../dist/esm/stores/zustand.js');
 const plus=router({pathname:'/a',search:'?category=code&keep=yes',hash:'#anchor'});
 const create=createRpZustand(plus,createStore);
 const store=create(set=>({category:'all',draft:'typed',setCategory:category=>set({category})}),{id:'filters',fields:{category:{query:true,values:['all','code']}}});
 await plus.whenReady();assert.equal(store.getState().category,'code');assert.equal(store.getState().draft,'typed');
 assert.equal((await plus.setState({category:'all',draft:'typed'},'filters')).ok,true);
 assert.match(plus.getContext().search,/keep=yes/);assert.equal(plus.getContext().hash,'#anchor');
 assert.equal((await plus.callState('filters/setCategory','code')).ok,true);
 await new Promise(resolve=>setTimeout(resolve,5));assert.match(plus.getContext().search,/category=code/);
 await plus.navigate('/b');assert.ok(store.getState().setCategory);await plus.dispose();
});

test('Redux wrapper retains dispatch and registers writable state through its native reducer',async()=>{
 const {configureStore}=await import('@reduxjs/toolkit');const {configureRpReduxStore}=await import('../dist/esm/stores/redux.js');
 const plus=router();const create=configureRpReduxStore(plus,configureStore);
 const store=create({reducer:(state={count:0},action)=>action.type==='inc'?{count:state.count+1}:state},'counter');
 assert.equal((await plus.setState({count:2},'counter')).ok,true);assert.equal(store.getState().count,2);
 await plus.callState('counter/dispatch',{type:'inc'});assert.equal(store.getState().count,3);await plus.dispose();
});

test('Jotai wrapper keeps atom identity and readonly derived atoms reject external writes',async()=>{
 const {atom,createStore}=await import('jotai/vanilla');const {createRpJotaiAtom}=await import('../dist/esm/stores/jotai.js');
 const plus=router();const store=createStore(),create=createRpJotaiAtom(plus,atom,store);
 const count=create(0,'count');assert.equal((await plus.setState(3,'count')).ok,true);assert.equal(store.get(count),3);
 const double=create(get=>get(count)*2,'double');assert.equal(plus.getState('double'),6);assert.equal((await plus.setState(9,'double')).reason,'state-readonly');
 await plus.dispose();
});

test('opaque field defaults require codecs and null retains its scalar type',()=>{
 const field={default:{range:new Date()},fields:{range:{query:true}}};
 assert.throws(()=>encodeQuery('filter',field,field.default),/custom encoding/);
 assert.equal(decodeQuery('value',{default:null,query:true},new URLSearchParams('value=null')),null);
 assert.throws(()=>decodeQuery('value',{default:null,query:true},new URLSearchParams('value={}')),/null/);
});

test('query-only values never copy live proxy sources into history and concurrent writes merge',async()=>{
 const {createStore}=await import('zustand/vanilla');const {createRpZustand}=await import('../dist/esm/stores/zustand.js');
 const plus=router();const create=createRpZustand(plus,createStore);
 const one=create(()=>({value:0}),{id:'one',query:true});const two=create(()=>({other:0}),{id:'two',query:true});
 await plus.whenReady();await Promise.all([plus.setState(1,'one/value'),plus.setState(2,'two/other')]);
 assert.equal(one.getState().value,1);assert.equal(two.getState().other,2);
 assert.deepEqual(structuredClone(plus.getContext().location.state).routerPlus.values,{});
 await plus.dispose();
});

test('query diagnostics contain owned address values and omit unbound source data',async()=>{
 const {createStore}=await import('zustand/vanilla');const {createRpZustand}=await import('../dist/esm/stores/zustand.js');const errors=[];
 const plus=createRouterPlus({pages:[{path:'/a',title:'A'}],globalKey:false,onDiagnostic:error=>errors.push(error)});
 plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?category=invalid'}}));
 const store=createRpZustand(plus,createStore)(()=>({category:'all',draft:'private-source-value'}),{id:'filter',fields:{category:{query:true,values:['all','code']}}});
 await plus.whenReady();assert.equal(store.getState().category,'all');
 const error=errors.find(item=>item.category==='state.query.invalid');assert.ok(error);assert.deepEqual(error.actual,{category:['invalid']});assert.doesNotMatch(JSON.stringify(error),/private-source-value/);
 await plus.dispose();
});

test('store creators cannot register into a disposed owner while unbound native creation still works',async()=>{
 const {createStore}=await import('zustand/vanilla');const {createRpZustand}=await import('../dist/esm/stores/zustand.js');
 const plus=router(),create=createRpZustand(plus,createStore);await plus.dispose();
 assert.throws(()=>create(()=>({value:1}),'late'),/disposed/);
 assert.equal(create(()=>({value:2})).getState().value,2);
});
