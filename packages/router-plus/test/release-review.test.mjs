import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from 'zustand/vanilla';
import {createRouterPlus} from '../dist/esm/index.js';
import {createMemoryConnection} from '../dist/esm/testing/index.js';
import {registerZustandState} from '../dist/esm/stores/zustand.js';
const pages=[{path:'/a',title:'A'},{path:'/b',title:'B'}];
function setup(options={}){const plus=createRouterPlus({pages,globalKey:false,...options});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));return plus;}
function gate(){let finish;return {promise:new Promise(resolve=>finish=resolve),finish:()=>finish()};}

test('scope facades use the same global store field paths and cancel commands after release',async()=>{
 const plus=setup(),store=createStore(()=>({count:1,filter:{category:'all'}}));const stop=registerZustandState(plus,store,'filters'),scope=plus.scope(plus.getContext());
 assert.equal(scope.getState('filters/count'),1);assert.ok(scope.listStateKeys().includes('filters'));assert.equal((await scope.setState(2,'filters/count')).ok,true);assert.equal(store.getState().count,2);
 assert.equal((await scope.patchState({category:'code'},'filters/filter')).ok,true);assert.equal(store.getState().filter.category,'code');
 await plus.navigate('/b');assert.equal((await scope.callState('missing')).reason,'cancelled');assert.equal((await scope.highlight({element:{}})).reason,'cancelled');stop();await plus.dispose();
});

test('disposed instances cannot resurrect interaction state through direct convenience APIs',async()=>{
 const plus=setup();await plus.dispose();assert.equal((await plus.highlight({element:{}})).reason,'cancelled');assert.equal((await plus.startTour([{target:{element:{}},message:'late'}])).reason,'cancelled');assert.equal((await plus.focus({element:{focus(){throw Error('must not run');}}})).reason,'cancelled');assert.equal(plus.getHighlight(),null);assert.equal(plus.getTour(),null);
});

test('cancelled target waits and late resolver errors return cancellation receipts',async()=>{
 let reject,begin;const started=new Promise(resolve=>begin=resolve),wait=new Promise((resolve,fail)=>reject=fail);
 const plus=setup({plugins:[{id:'resolver',setup(api){api.registerTargetResolver('wait',{resolve(){begin();return wait;}});}}]});await plus.whenReady();const pending=plus.highlight({target:'wait'});await started;await plus.clearHighlight();reject(Error('late'));assert.equal((await pending).reason,'cancelled');await plus.dispose();
});

test('superseded asynchronous scroll and tour afterStep callbacks cannot report live success',async()=>{
 const scroll=gate(),began=gate();const plus=setup({plugins:[{id:'scroll',setup(api){api.registerScrollStrategy({id:'wait',scroll(){began.finish();return scroll.promise;}});}}]});await plus.whenReady();
 const pending=plus.scrollTo({element:{}});await began.promise;await plus.clearHighlight();scroll.finish();assert.equal((await pending).reason,'cancelled');
 const after=gate(),entered=gate();const tour=plus.startTour([{target:{element:{}},message:'one'}],{afterStep(){entered.finish();return after.promise;}});await entered.promise;await plus.stopTour();after.finish();assert.equal((await tour).reason,'cancelled');await plus.dispose();
});

test('query projections retain prototype-named keys without changing object prototypes',async()=>{
 const plus=setup();const plan=plus.resolveTarget('/a?__proto__=safe&constructor=first&constructor=second&toString=value');assert.equal(plan.query.__proto__,'safe');assert.equal(plan.query.constructor,'first');assert.equal(plan.query.toString,'value');assert.equal(Object.getPrototypeOf(plan.query),Object.prototype);await plus.dispose();
});

test('plugin renderer rollback releases resources from a partially failed mount',async()=>{
 const plus=setup();let allocated=0,destroyed=0;const failure=Error('mount failed');
 await assert.rejects(plus.use({id:'partial-renderer',setup(api){api.registerHighlightRenderer({mount(){allocated++;throw failure;},render(){},destroy(){allocated--;destroyed++;}},{});}}),error=>error===failure);
 assert.equal(allocated,0);assert.equal(destroyed,1);assert.equal(plus.hasCustomRenderer,false);await plus.dispose();
});
