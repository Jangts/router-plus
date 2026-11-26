/**
 * Page state, instance identity and retention.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterPlus } from '../dist/esm/index.js';
import { createMemoryConnection } from '../dist/esm/testing/index.js';

const pages = [
  { path: '/a', title: 'A', state: { initial: { count: 0 } } },
  {
    path: '/u/:id',
    title: 'User',
    instanceKey: { params: ['id'] },
    retain: true,
    state: { initial: () => ({ count: 0 }) },
  },
  {
    path: '/item/:id',
    title: 'Item',
    instanceKey: { params: ['id'] },
    retain: { max: 2 },
    state: { initial: { count: 0 } },
  },
];

function setup(pathname = '/a', options = {}) {
  const plus = createRouterPlus({ pages, globalKey: false, ...options });
  const connection = createMemoryConnection({ initial: { pathname } });
  plus.connect(connection);
  return { plus, connection };
}

test('owned state supports set, patch and reset through commands', async () => {
  const { plus } = setup();
  assert.deepEqual(plus.getState(), { count: 0 });
  assert.equal((await plus.setState({ count: 1 })).ok, true);
  assert.equal(plus.getState().count, 1);
  assert.equal((await plus.patchState({ extra: true })).ok, true);
  assert.deepEqual(plus.getState(), { count: 1, extra: true });
  assert.equal((await plus.resetState()).ok, true);
  assert.deepEqual(plus.getState(), { count: 0 });
});

test('bridge writes are serialized per state key', async () => {
  const { plus } = setup();
  const order = [];
  plus.registerStateBridge('queue', {
    read: () => ({ value: 0 }),
    async write(next) {
      order.push(`start:${next.value}`);
      await new Promise(resolve => setTimeout(resolve, 10));
      order.push(`end:${next.value}`);
    },
    subscribe: () => () => undefined,
  });
  await Promise.all([
    plus.setState({ value: 1 }, 'queue'),
    plus.setState({ value: 2 }, 'queue'),
  ]);
  assert.deepEqual(order, ['start:1', 'end:1', 'start:2', 'end:2']);
});

test('readonly bridges reject writes with state-readonly', async () => {
  const { plus } = setup();
  plus.registerStateBridge('readonly', { read: () => ({ value: 1 }) });
  assert.deepEqual(plus.getState('readonly'), { value: 1 });
  const result = await plus.setState({ value: 2 }, 'readonly');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'state-readonly');
  assert.deepEqual(plus.getState('readonly'), { value: 1 });
});

test('instance state is isolated per parameter and survives traversal when retained', async () => {
  const { plus } = setup('/u/1');
  await plus.setState({ count: 1 });
  await plus.navigate('/u/2');
  assert.deepEqual(plus.getState(), { count: 0 });
  await plus.setState({ count: 2 });
  await plus.back();
  assert.equal(plus.getContext().params.id, '1');
  assert.deepEqual(plus.getState(), { count: 1 });
});

test('retention max evicts the least recently used inactive instance', async () => {
  const { plus } = setup('/item/1');
  const released = [];
  plus.subscribe(event => {
    if (event.type === 'release') released.push(event.instance.instanceKey);
  });
  await plus.navigate('/item/2');
  await plus.navigate('/item/3');
  assert.equal(plus.getContext().params.id, '3');
  assert.equal(plus.getContext().instance.retained, true);
  assert.deepEqual(released, ['1']);
});

test('release rebuilds the current scope', async () => {
  const { plus } = setup('/a');
  await plus.setState({ count: 5 });
  assert.equal(plus.getContext().instance.retained, false);
  const result = await plus.release();
  assert.equal(result.ok, true);
  assert.deepEqual(plus.getState(), { count: 0 });
});

test('state commands without a page instance fail without throwing', async () => {
  const plus = createRouterPlus({ pages, globalKey: false });
  plus.connect(createMemoryConnection({ initial: { pathname: '/unknown' } }));
  const result = await plus.setState({ value: 1 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'state-unknown');
  assert.equal(plus.getState(), undefined);
});
