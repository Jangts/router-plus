import { createRefStateBridge } from '../dist/esm/core/ref-bridge.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlus} from '../dist/esm/index.js';
import {createMemoryConnection} from '../dist/esm/testing/index.js';

const states = {
  category: {default:'all', values:['all','code'], query:true},
  language: {default:'zh', values:['zh','en']},
  page: {default:1, validate:value=>Number.isInteger(value)&&value>0, query:'p'},
};
function setup(initial={pathname:'/a',search:'?unrelated=keep',hash:'#anchor'}) {
  const plus=createRouterPlus({pages:[{path:'/a',title:'A',states},{path:'/b',title:'B'}],globalKey:false});
  const connection=createMemoryConnection({initial});plus.connect(connection);return {plus,connection};
}

test('declared states validate, bind query and restore history independently',async()=>{
  const {plus}=setup();
  assert.equal(plus.getState('category'),'all');
  assert.equal((await plus.setState('code','category')).ok,true);
  assert.match(plus.getContext().search,/unrelated=keep/);
  assert.match(plus.getContext().search,/category=code/);
  assert.equal(plus.getContext().hash,'#anchor');
  assert.equal((await plus.setState('xx','category')).ok,false);
  assert.equal(plus.getState('category'),'code');
  assert.equal((await plus.setState(2,'page')).ok,true);
  assert.match(plus.getContext().search,/p=2/);
  await plus.setState('en','language');
  assert.doesNotMatch(plus.getContext().search,/language/);
  await plus.navigate('/b');await plus.back();
  assert.equal(plus.getState('language'),'en');
  assert.equal(plus.getState('page'),2);
  assert.equal(plus.resolveTarget('/a?category=invalid'),null);
  assert.equal(plus.resolveTarget('/a?p=1&p=2'),null);
  await plus.resetState('category');assert.equal(plus.getState('category'),'all');
  await plus.dispose();
});

test('cross-page values use one state contract and defaults reset on ordinary navigation',async()=>{
  const {plus}=setup();await plus.navigate('/b');
  assert.equal((await plus.navigate({page:'/a',values:{language:'en',category:'code'}})).ok,true);
  assert.equal(plus.getState('language'),'en');
  await plus.navigate('/a');assert.equal(plus.getState('language'),'zh');
  assert.equal(plus.resolveTarget({path:'/a',values:{missing:'x'}}),null);
  await plus.dispose();
});

test('ref bridge receives address restoration and remains the read source',async()=>{
  const {plus}=setup({pathname:'/a',search:'?category=code',hash:''});
  const source={current:'all'};const stop=plus.registerStateBridge('category',createRefStateBridge(source));
  await plus.whenReady();assert.equal(source.current,'code');
  assert.equal((await plus.setState('all','category')).ok,true);
  assert.equal(source.current,'all');assert.equal(plus.getState('category'),source.current);
  stop();await plus.dispose();
});

test('registration rules support plain global stores and remounting',async()=>{
  const {plus}=setup();let value='one', listener;
  const bridge={read:()=>value,write:next=>{value=next;listener?.();},subscribe:fn=>{listener=fn;return()=>{listener=undefined;};}};
  const rules={default:'one',values:['one','two'],query:'choice'};
  let stop=plus.registerStateBridge('choice',bridge,rules);await plus.whenReady();
  value='two';listener();await new Promise(resolve=>setTimeout(resolve,10));
  assert.match(plus.getContext().search,/choice=two/);
  stop();stop=plus.registerStateBridge('choice',bridge,{...rules});await plus.whenReady();
  assert.equal(plus.getState('choice'),'two');
  stop();await plus.dispose();
});

test('Vue ref and reactive bridges preserve reactive source identity',async()=>{
  const {ref,reactive}=await import('vue');
  const {createVueStateBridge}=await import('../dist/esm/vue/state-bridge.js');
  const source=ref('all');const bridge=createVueStateBridge(source);let notified=0;
  const stop=bridge.subscribe(()=>notified++);await bridge.write('code');
  assert.equal(source.value,'code');assert.equal(notified,1);stop();
  const object=reactive({a:1,b:2});const objectBridge=createVueStateBridge(object);
  await objectBridge.write({a:3});assert.equal(objectBridge.read(),object);assert.deepEqual(object,{a:3});
});

test('bridge restore failure reports committed navigation and a diagnostic',async()=>{
  const diagnostics=[];
  const plus=createRouterPlus({pages:[{path:'/a',title:'A',states}],globalKey:false,onDiagnostic:(error,stage)=>diagnostics.push(stage)});
  plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));
  plus.registerStateBridge('category',{read:()=> 'all',write:()=>{throw new Error('source unavailable');}});
  const result=await plus.setState('code','category');
  assert.equal(result.ok,false);assert.equal(result.committed,true);
  assert.match(plus.getContext().search,/category=code/);
  assert.ok(diagnostics.includes('state.navigation.restore'));
  await plus.dispose();
});

test('object navigation defaults are isolated and Vue proxies do not echo restoration',async()=>{
  const {reactive}=await import('vue');
  const {createVueStateBridge}=await import('../dist/esm/vue/state-bridge.js');
  const plus=createRouterPlus({pages:[{path:'/a',title:'A',states:{filter:{default:{sort:'asc'}}}},{path:'/b',title:'B',states:{filter:{default:{sort:'asc'}}}}],globalKey:false});
  plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));
  const original=plus.getState('filter');original.sort='desc';
  await plus.navigate('/b');assert.equal(plus.getState('filter').sort,'asc');
  const source=reactive({sort:'asc'});plus.registerStateBridge('filter',createVueStateBridge(source));
  assert.equal((await plus.setState({sort:'desc'},'filter')).ok,true);
  assert.equal(source.sort,'desc');await plus.whenReady();
  assert.equal(plus.getContext().values.filter.sort,'desc');await plus.dispose();
});
