import test from 'node:test';
import assert from 'node:assert/strict';
import { hasLiveStateRules } from '../dist/esm/core/state-fields.js';
import { updatePageQuery } from '../dist/esm/core/query-update.js';
import { createRouterPlus } from '../dist/esm/index.js';
import { createMemoryConnection } from '../dist/esm/testing/index.js';

test('live-rule discovery includes nested callback contracts without requiring a loading predicate',()=>{
 assert.equal(hasLiveStateRules({default:'',query:true}),false);
 for(const field of [{observe:()=>()=>{}},{validate:()=>true},{encode:String},{decode:String},{groupDecode:()=>({})},{codec:{encode:String,decode:String}},{ready:()=>true},{fields:{nested:{fields:{value:{validate:()=>true}}}}}]) assert.equal(hasLiveStateRules(field),true);
});

test('functional query updates accept native-style initializer results',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?keep=yes',hash:'#anchor'}}));
 try{
  assert.equal((await updatePageQuery(plus,previous=>({keep:previous.get('keep'),tags:['one','two']}),{replace:true})).ok,true);
  assert.equal(plus.getContext().hash,'#anchor');assert.deepEqual(new URLSearchParams(plus.getContext().search).getAll('tags'),['one','two']);
  assert.equal((await updatePageQuery(plus,()=>[['term','value']],{replace:true})).ok,true);
  assert.equal(plus.getContext().search,'?term=value');
 } finally{await plus.dispose();}
});

test('query patches capture inputs, preserve siblings/hash and avoid redundant guards',async()=>{
 const {patchPageQuery}=await import('../dist/esm/core/query-update.js');
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?keep=yes&remove=old',hash:'#anchor'}}));let guards=0;plus.registerGuard({id:'count',beforeLeave:()=>{guards++;return true;}});
 try{const tags=['one','two'];const patch={remove:undefined,tags,empty:''};const p=patchPageQuery(plus,patch,{replace:true});tags.push('late');patch.empty='changed';assert.equal((await p).ok,true);const q=new URLSearchParams(plus.getContext().search);assert.deepEqual(q.getAll('tags'),['one','two']);assert.equal(q.get('keep'),'yes');assert.equal(q.get('empty'),'');assert.equal(q.has('remove'),false);assert.equal(plus.getContext().hash,'#anchor');const before=guards;assert.equal((await patchPageQuery(plus,{empty:''})).reason,'noop');assert.equal(guards,before);
 const a=updatePageQuery(plus,{fresh:'value'},{replace:true});const b=patchPageQuery(plus,{tags:[] ,extra:'yes'},{replace:true});assert.equal((await a).ok,true);assert.equal((await b).ok,true);assert.deepEqual(Object.fromEntries(new URLSearchParams(plus.getContext().search)),{fresh:'value',extra:'yes'});
 }finally{await plus.dispose();}
});

test('page targets accept complete parameterized hash links and reject malformed hashes',async()=>{
 const plus=createRouterPlus({pages:[{id:'detail',path:'/item/:id'}],globalKey:false});
 try{assert.equal(plus.resolveHref({page:'detail',params:{id:'one'},query:{q:'x'},hash:'#chapter'}),'/item/one?q=x#chapter');for(const hash of ['chapter','#bad\\path','#bad\npath'])assert.equal(plus.resolveLink({page:'detail',params:{id:'one'},hash}),null);}
 finally{await plus.dispose();}
});

test('query patches never materialize unnamed read defaults into an empty URL',async()=>{
 const {patchPageQuery}=await import('../dist/esm/core/query-update.js');const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));
 try{assert.equal((await patchPageQuery(plus,{},undefined,{sort:'default'})).reason,'noop');assert.equal(plus.getContext().search,'');assert.equal((await patchPageQuery(plus,{term:'hi'},{replace:true},{sort:'default'})).ok,true);assert.equal(plus.getContext().search,'?term=hi');}
 finally{await plus.dispose();}
});

test('root and same-page scoped query writers share one atomic query batch',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a',retain:true}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a',search:'?keep=yes'}}));const scope=plus.scope();
 try{const a=plus.patchQuery({one:'1'}),b=updatePageQuery(scope,q=>{q.set('two','2');return q;});assert.equal((await a).ok,true);assert.equal((await b).ok,true);assert.deepEqual(Object.fromEntries(new URLSearchParams(plus.getContext().search)),{keep:'yes',one:'1',two:'2'});}
 finally{await plus.dispose();}
});

test('released scoped query edits are removed without cancelling live root edits',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a',retain:true}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const scope=plus.scope();
 try{const a=scope.patchQuery({retired:'yes'}),b=plus.patchQuery({live:'yes'});await plus.release();assert.equal((await a).ok,false);assert.equal((await b).ok,true);assert.equal(new URLSearchParams(plus.getContext().search).has('retired'),false);}
 finally{await plus.dispose();}
});

test('a frozen scoped query batch is superseded when the owner navigates before flush',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a',retain:true},{path:'/b',retain:true}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const scope=plus.scope();
 try{const pending=scope.patchQuery({late:'yes'});plus.reportLocation({pathname:'/b',search:'',hash:''});assert.equal((await pending).reason,'superseded');assert.equal(plus.getContext().pathname,'/b');}
 finally{await plus.dispose();}
});

test('different target scopes never mix query projections',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a',retain:true},{path:'/b',retain:true}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const a=plus.scope();plus.reportLocation({pathname:'/b',search:'',hash:''});
 try{const old=a.patchQuery({fromA:'yes'}),current=plus.patchQuery({fromB:'yes'});await Promise.all([old,current]);assert.equal(plus.getContext().pathname,'/b');assert.deepEqual(Object.fromEntries(new URLSearchParams(plus.getContext().search)),{fromB:'yes'});}
 finally{await plus.dispose();}
});

test('disposed query patches return cancellation instead of no-op',async()=>{
 const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const pending=plus.patchQuery({});await plus.dispose();assert.equal((await pending).reason,'cancelled');
});

for(const nativeFirst of [true,false]) for(const slow of [false,true]) test(`native state and query patches preserve both intentions (${nativeFirst?'native-first':'patch-first'}, ${slow?'guard':'same-turn'})`,async()=>{
 const {bindNativeSource}=await import('../dist/esm/core/native-bindings.js');const plus=createRouterPlus({pages:[{path:'/a'}],globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));let value='overview',notify,unlock,entered;const started=new Promise(r=>entered=r);const stop=bindNativeSource(plus,{read:()=>value,write:v=>value=v,subscribe:fn=>{notify=fn;return()=>{};}},{id:'tab',query:true});await plus.whenReady();let guard=0;const off=plus.registerGuard({id:'combined',beforeLeave:()=>{if(slow&&++guard===1){entered();return new Promise(r=>unlock=r);}return true;}});
 try{let patch;if(nativeFirst){value='products';notify();if(slow)await started;patch=plus.patchQuery({term:'new'});}else{patch=plus.patchQuery({term:'new'});if(slow)await started;value='products';notify();}unlock?.(true);const result=await patch;await plus.whenReady();const query=new URLSearchParams(plus.getContext().search);assert.equal(query.get('tab'),'products');assert.equal(query.get('term'),'new');if(!slow)assert.equal(result.ok,true);}
 finally{unlock?.(true);off();stop();await plus.dispose();}
});
