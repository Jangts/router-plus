/**
 * Interaction state without a DOM runtime, plus target and command failures.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterPlus } from '../dist/esm/index.js';
import { createMemoryConnection } from '../dist/esm/testing/index.js';

const pages = [{ path: '/', title: 'Home' }];

function setup() {
  const plus = createRouterPlus({ pages, globalKey: false });
  plus.connect(createMemoryConnection({ initial: { pathname: '/' } }));
  return plus;
}

test('highlight accepts an element ref without installing a DOM runtime', async () => {
  const plus = setup();
  const element = { id: 'save' };
  const result = await plus.highlight({ element });
  assert.equal(result.ok, true);
  assert.equal(plus.getHighlight().element, element);
  await plus.clearHighlight();
  assert.equal(plus.getHighlight(), null);
});

test('missing targets report target-not-found', async () => {
  const plus = setup();
  const highlight = await plus.highlight('missing');
  assert.equal(highlight.ok, false);
  assert.equal(highlight.reason, 'target-not-found');
  const focus = await plus.focus({ selector: '#missing' });
  assert.equal(focus.ok, false);
  assert.equal(focus.reason, 'target-not-found');
});

test('focus works on focusable elements and rejects others', async () => {
  const plus = setup();
  let focused = false;
  const focusable = { focus: () => (focused = true) };
  assert.equal((await plus.focus({ element: focusable })).ok, true);
  assert.equal(focused, true);
  const result = await plus.focus({ element: {} });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unsupported-command');
});

test('scroll reports dom-unavailable in a non-DOM host', async () => {
  const plus = setup();
  const result = await plus.scrollTo('missing');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'dom-unavailable');
});

test('tour advances, waits for user and finishes', async () => {
  const plus = setup();
  const first = { element: { id: 'first' } };
  const second = { element: { id: 'second' } };
  const started = await plus.startTour([
    { target: first, message: 'first', awaitUser: true },
    { target: second, message: 'second' },
  ]);
  assert.equal(started.ok, true);
  assert.equal(plus.getTour().index, 0);
  assert.equal(plus.getTour().awaiting, true);
  assert.equal(plus.getHighlight().message, 'first');

  assert.equal((await plus.nextTourStep()).ok, true);
  assert.equal(plus.getTour().index, 1);
  assert.equal(plus.getHighlight().message, 'second');

  assert.equal((await plus.nextTourStep()).ok, true);
  assert.equal(plus.getTour(), null);
  assert.equal(plus.getHighlight(), null);
});

test('commands dispatch through the declarative table and reject unknown kinds', async () => {
  const plus = setup();
  const tab = await plus.execute({ kind: 'tab.read' });
  assert.equal(tab.ok, true);
  assert.equal(tab.value, null);
  const unknown = await plus.execute({ kind: 'unknown.command' });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unsupported-command');
});

test('navigation actions are registered, invoked and reported as unknown when missing', async () => {
  const plus = setup();
  let received;
  const unregister = plus.registerNavigationAction('open', {
    invoke(payload, context) {
      received = { payload, pageId: context.pageId };
    },
  });
  const result = await plus.executeAction('open', { id: 1 });
  assert.equal(result.ok, true);
  assert.deepEqual(received, { payload: { id: 1 }, pageId: '/' });
  unregister();
  const missing = await plus.executeAction('open');
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, 'unknown-action');
});

test('tour movement shares signed relative steps across commands and typed methods',async()=>{
 const plus=setup();const entered=[];let finished=0;
 await plus.startTour(Array.from({length:4},(_,i)=>({target:{element:{id:String(i)}},message:String(i)})),{beforeStep:i=>{entered.push(i);},onFinish:()=>finished++});
 assert.equal((await plus.execute({kind:'tour.next',step:2})).ok,true);assert.equal(plus.getTour().index,2);assert.equal(plus.getHighlight().message,'2');
 await plus.nextTourStep(-1);assert.equal(plus.getTour().index,1);await plus.prevTourStep();assert.equal(plus.getTour().index,0);
 const tour=plus.getTour(),visits=entered.length;await plus.nextTourStep(0);await plus.nextTourStep(-99);assert.equal(plus.getTour(),tour);assert.equal(entered.length,visits);
 assert.equal((await plus.nextTourStep(1.5)).reason,'invalid-target');assert.equal(plus.getTour(),tour);
 await plus.nextTourStep(99);assert.equal(plus.getTour(),null);assert.equal(finished,1);await plus.dispose();
});
