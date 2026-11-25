import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlusTest} from '@jangts/router-plus/testing';
for (const initial of ['/a?x=1#mark','/b']) test(`DOM-free fixture ${initial}`, async()=>{
 assert.equal(typeof document,'undefined');
 const f=await createRouterPlusTest({pages:[{path:'/a',title:'A'},{path:'/b',title:'B'}],initial});
 try {
 assert.equal(f.plus.getContext().path,initial);
 assert.equal((await f.plus.navigate('/a?x=2')).ok,true);
 assert.equal(f.connection.location.search,'?x=2');
 const stop=f.plus.registerGuard({id:'deny',beforeLeave:()=>false});
 assert.equal((await f.plus.navigate('/b')).ok,false);stop();
 } finally { const a=f.dispose();assert.equal(a,f.dispose());await a; }
 assert.equal((await f.plus.navigate('/a')).ok,false);
});
test('real command receipts update owned state and a new fixture starts clean',async()=>{
 const options={pages:[{path:'/a',title:'A',state:{initial:{count:0}}}],initial:'/a'};
 for(let i=0;i<2;i++) {
 const f=await createRouterPlusTest(options);
 try {
 assert.equal(f.plus.getState().count,0);
 const receipt=await f.plus.setState({count:7});
 assert.equal(receipt.ok,true);assert.equal(f.plus.getState().count,7);
 }finally {await f.dispose();}
 }
});
test('cleanup continues after errors and retains initialization error',async()=>{
 const {createCleanup}=await import('../dist/esm/testing/lifecycle.js');
 const cleanup=createCleanup(),calls=[];
 cleanup.add(()=>calls.push('outer'));
 cleanup.add(()=>{calls.push('inner');throw new Error('release');});
 const original=new Error('initialize');
 await assert.rejects(cleanup.fail(original),error=>error instanceof AggregateError && error.errors[0]===original);
 assert.deepEqual(calls,['inner','outer']);
});
