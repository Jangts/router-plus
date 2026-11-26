import test from 'node:test';
import assert from 'node:assert/strict';
import {createRouterPlus} from '../dist/esm/index.js';

test('existing target resolution covers shared App wrappers without business-specific handlers',async()=>{
 const plus=createRouterPlus({origin:'https://app.test',globalKey:false,pages:[{id:'dashboard',path:'/dashboard'},{id:'detail',path:'/campaigns/:id'}],initialLocation:{pathname:'/dashboard',search:'?keep=yes',hash:'#old'}});
 try{
  for(const [target,href] of [['#new','/dashboard?keep=yes#new'],['?tab=products','/dashboard?tab=products'],['https://app.test/dashboard?x=1','/dashboard?x=1'],['https://other.test/a','https://other.test/a']])assert.equal(plus.resolveLink(target)?.href,href);
  assert.equal(plus.resolveLink({page:'detail',params:{id:'one'}})?.href,'/campaigns/one');
  for(const target of ['//other.test','javascript:alert(1)','https://user:password@app.test/dashboard'])assert.equal(plus.resolveLink(target),null);
  assert.equal(plus.match('/missing'),null);assert.equal(plus.resolveLink({page:'unknown'}),null);
 }finally{await plus.dispose();}
});

test('synthetic targets do not borrow the origin framework page mapping',async()=>{
 const {createMemoryConnection}=await import('../dist/esm/testing/index.js');let entering;
 const plus=createRouterPlus({pages:[{id:'a',path:'/a'},{id:'b',path:'/b',guards:{beforeEnter:({context})=>{entering=context.pageId;return true;}}}],globalKey:false});
 plus.connect(createMemoryConnection({initial:{pathname:'/a',matched:[{pageId:'a',params:{}}]}}));
 try{assert.equal(plus.resolveLink('/b')?.pageId,'b');assert.equal((await plus.navigate('/b')).ok,true);assert.equal(entering,'b');}
 finally{await plus.dispose();}
});
