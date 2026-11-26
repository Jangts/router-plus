import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlus} from '../dist/esm/index.js';
import {bindNativeSource,registerSourceGroup} from '../dist/esm/core/native-bindings.js';
import {registerZustandState} from '../dist/esm/stores/zustand.js';
import {createStore} from 'zustand/vanilla';
import {createMemoryConnection} from '../dist/esm/testing/index.js';
const pages=[{path:'/a',title:'A',retain:true,states:{unmounted:{default:0,query:true}}},{path:'/b',title:'B',retain:true}];
function setup(extra={}){const plus=createRouterPlus({pages,globalKey:false,...extra});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?count=2'}}));return plus;}

test('inspection is frozen metadata, does not read sources and distinguishes address declarations',async()=>{
 const plus=setup(),store=createStore(()=>({count:0,increment(){return this.count+1;}}));const stop=registerZustandState(plus,store,{id:'counter',fields:{count:{query:true}}});await plus.whenReady();
 let reads=0;const release=bindNativeSource(plus,{read(){reads++;return 4;}},'local');const before=reads;
 assert.equal(plus.inspectState('unmounted'),null);assert.equal(plus.inspectState('counter/count'),null);
 const source=plus.inspectState('counter');assert.deepEqual(source.capabilities,{read:true,write:true,call:false});assert.deepEqual(source.queryKeys,['count']);assert.equal(source.scope,'global');assert.equal(plus.inspectState('counter/increment').parentId,'counter');assert.equal(Object.isFrozen(source),true);assert.equal(Object.isFrozen(source.capabilities),true);assert.equal(Object.isFrozen(source.queryKeys),true);assert.ok(plus.inspectState().some(item=>item.id==='local'));assert.equal(reads,before);
 const scope=plus.scope(plus.getContext());await plus.navigate('/b');assert.equal(plus.inspectState('local'),null);assert.equal(scope.inspectState('local').scope,'page');assert.equal(scope.inspectState('counter').scope,'global');release();stop();assert.equal(scope.inspectState('counter/increment'),null);await plus.dispose();assert.deepEqual(plus.inspectState(),[]);assert.equal(scope.inspectState('local'),null);
});

test('group rollback hides all failed metadata and commits one address rebuild per batch',async()=>{
 const plus=setup();let locations=0;const connect=plus.connect; // Track public matcher use rather than private implementation calls.
 let matches=0;const {defaultMatcher}=await import('../dist/esm/index.js');const owner=setup({matcher:{...defaultMatcher,matchPages(...args){matches++;return defaultMatcher.matchPages(...args);}}});const start=matches;
 const stop=registerSourceGroup(owner,collect=>{for(const id of ['first','second','third'])collect(bindNativeSource(owner,{read:()=>1,write(){}},id));});await owner.whenReady();assert.equal(matches-start,1);
 assert.throws(()=>registerSourceGroup(owner,collect=>{collect(bindNativeSource(owner,{read:()=>1},'failed'));collect(bindNativeSource(owner,{read:()=>1},'first'));}));assert.equal(owner.inspectState('failed'),null);stop();await owner.dispose();await plus.dispose();
});

test('diagnostic sink exceptions cannot escape invalid query restoration or host cleanup',async()=>{
 const plus=setup({onDiagnostic(){throw Error('sink');}});const stop=bindNativeSource(plus,{read:()=>1,write(){}},{id:'count',query:true});plus.reportLocation({pathname:'/a',search:'?count=invalid',hash:''});await plus.whenReady();plus.registerHost({dispose(){throw Error('host');}});stop();await plus.dispose();
});

test('non-plain object codecs receive the declared parameter collection',async()=>{
 for(const initial of [new Map([['a',1]]),new Set([1]),new Date(0)]){
  const plus=setup();let value=initial,decoded=false;const stop=bindNativeSource(plus,{read:()=>value,write(next){value=next;}},{id:'collection',query:'count',encode:()=> '2',decode(params){assert.ok(params instanceof URLSearchParams);decoded=true;return initial;}},true);await plus.whenReady();assert.ok(decoded);stop();await plus.dispose();
 }
});

test('inspection never exposes a half-installed store during synchronous subscription setup',async()=>{
 const plus=setup(),native=createStore(()=>({count:0,increment:()=>1}));let during;
 const store={...native,subscribe(listener){during=plus.inspectState();return native.subscribe(listener);}};
 const stop=registerZustandState(plus,store,'atomic');assert.deepEqual(during,[]);assert.ok(plus.inspectState('atomic/increment'));stop();await plus.dispose();
});

test('retained same-name sources survive another instance unregistering and finally release rules',async()=>{
 const plus=createRouterPlus({pages:[{path:'/item/:id',title:'Item',retain:true}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/item/1',search:'?value=5'}}));const first=plus.scope(plus.getContext());let a=0,b=0;
 const stopA=bindNativeSource(first,{read:()=>a,write(next){a=next;}},{id:'selection',query:'value'});await plus.whenReady();await plus.navigate('/item/2?value=6');const second=plus.scope(plus.getContext());const stopB=bindNativeSource(second,{read:()=>b,write(next){b=next;}},{id:'selection',query:'value'});await plus.whenReady();assert.equal(a,5);assert.equal(b,6);stopA();assert.ok(second.inspectState('selection'));await plus.navigate('/item/2?value=7');assert.equal(b,7);stopB();assert.equal(plus.pages.get('/item/:id').states.selection,undefined);await plus.dispose();
});

test('configuration snapshots isolate compiled query ownership from later caller edits',async()=>{
 const plus=setup();let value={count:0};const options={id:'fixed',fields:{count:{query:'count',values:[0,2]}}};const stop=bindNativeSource(plus,{read:()=>value,write(next){value=next;}},options,true);options.fields.count.query='renamed';options.fields.count.values.push(8);assert.deepEqual(plus.inspectState('fixed').queryKeys,['count']);assert.equal((await plus.setState({count:8},'fixed')).reason,'invalid-target');stop();await plus.dispose();
});

test('speculative scope candidates do not claim the public instance identity before commit',async()=>{
 const {prepareNativeScope}=await import('../dist/esm/core/native-bindings.js');const plus=setup(),context=plus.getContext();const candidate=prepareNativeScope(plus,context);const published=plus.scope(context);assert.notEqual(candidate.facade,published);candidate.commit();assert.equal(candidate.facade.scope(),published);await plus.navigate('/b');assert.equal(candidate.facade.getContext().pageId,'/a');await plus.dispose();assert.equal((await candidate.facade.setState(1,'ended')).reason,'cancelled');
});

test('late scope commits cannot reclaim an instance released before or after candidate publication',async()=>{
 const {prepareNativeScope}=await import('../dist/esm/core/native-bindings.js');const plus=createRouterPlus({pages:[{path:'/a',title:'A'},{path:'/b',title:'B'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const candidate=prepareNativeScope(plus,plus.getContext());candidate.commit();await plus.navigate('/b');candidate.commit();assert.equal((await candidate.facade.setState(1,'old')).reason,'cancelled');
 const abandoned=prepareNativeScope(plus,plus.getContext());await plus.navigate('/a');abandoned.commit();assert.equal((await abandoned.facade.callState('old')).reason,'cancelled');await plus.navigate('/b');const fresh=plus.scope();const stop=bindNativeSource(fresh,{read:()=>1,write(){}},'fresh');assert.ok(fresh.inspectState('fresh'));stop();await plus.dispose();
});

test('global Map codecs restore the encoded projection rather than JSON-empty object equality',async()=>{
 const plus=setup();let value=new Map([['a',1]]);const stop=bindNativeSource(plus,{read:()=>value,write(next){value=next;}},{id:'map',query:'count',encode:map=>String(map.get('a')),decode:query=>new Map([['a',Number(query.get('count')??1)]])},true);await plus.whenReady();assert.equal(value.get('a'),2);assert.equal((await plus.setState(new Map([['a',3]]),'map')).ok,true);assert.equal(value.get('a'),3);assert.equal(new URLSearchParams(plus.getContext().search).get('count'),'3');stop();await plus.dispose();
});
