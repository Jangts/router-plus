import test from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlus} from '../dist/esm/index.js';
import {createMemoryConnection} from '../dist/esm/testing/index.js';
import {updatePageQuery} from '../dist/esm/core/query-update.js';
function setup(states,options={}){const plus=createRouterPlus({pages:[{path:'/a',states},{path:'/b'}],globalKey:false,...options});plus.connect(createMemoryConnection({initial:{pathname:'/a',state:{draft:'keep'},hash:'#part'}}));return plus;}

test('partial query preserves non-query navigation values and caller history state',async()=>{
 const plus=setup({selection:{default:'one',query:false}});
 try{await plus.setState('two','selection');assert.equal((await plus.patchQuery({q:'coffee'})).ok,true);assert.equal(plus.getState('selection'),'two');assert.equal(plus.getContext().location.state.draft,'keep');assert.equal(plus.getContext().hash,'#part');assert.equal((await plus.scope().patchQuery({page:'2'})).ok,true);assert.equal(plus.getState('selection'),'two');assert.equal(plus.getContext().location.state.draft,'keep');}
 finally{await plus.dispose();}
});

test('partial query honors explicit history override while complete query replacement keeps its contract',async()=>{
 const plus=setup({selection:{default:'one',query:false}});
 try{await plus.setState('two','selection');await plus.patchQuery({q:'coffee'},{state:{draft:'override'}});assert.equal(plus.getContext().location.state.draft,'override');assert.equal(plus.getState('selection'),'two');await updatePageQuery(plus,{next:'yes'});assert.equal(plus.getState('selection'),'one');assert.equal(plus.getContext().location.state.draft,undefined);}
 finally{await plus.dispose();}
});

test('query patch sequences follow actual redirect receipts',async()=>{
 const plus=setup(undefined,{pages:[{path:'/a',guards:{beforeEnter:()=>({redirect:'/b'})}},{path:'/b'}]});
 try{const result=await plus.execute([{kind:'query.patch',patch:{q:'one'}},{kind:'context.read'}]);assert.equal(result.ok,true);assert.equal(result.results.length,2);assert.equal(result.results[1].value.pageId,'/b');}
 finally{await plus.dispose();}
});

test('primitive caller state survives repeated namespaced state navigation',async()=>{
 const plus=setup({n:{default:0,query:true}});
 try{for(const state of [42,false,null,'caller']){await plus.navigate('/a',{state});await plus.setState(1,'n');assert.deepEqual(plus.getContext().location.state.routerPlus.rawState,state);await plus.patchQuery({q:'one'});assert.deepEqual(plus.getContext().location.state.routerPlus.rawState,state);await plus.setState(2,'n');assert.deepEqual(plus.getContext().location.state.routerPlus.rawState,state);}}
 finally{await plus.dispose();}
});

test('prototype-named non-query states remain own data values throughout address transactions',async()=>{
 const states=Object.fromEntries([['__proto__',{default:0,query:false}],['constructor',{default:'initial',query:false}]]);const plus=setup(states);
 try{assert.equal((await plus.setState(7,'__proto__')).ok,true);assert.equal(plus.getState('__proto__'),7);await plus.setState('changed','constructor');await plus.patchQuery({q:'one'});assert.equal(plus.getState('__proto__'),7);assert.equal(plus.getState('constructor'),'changed');assert.equal(Object.hasOwn(plus.getContext().values,'__proto__'),true);}
 finally{await plus.dispose();}
});
