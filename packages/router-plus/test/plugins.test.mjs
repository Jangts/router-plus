/**
 * Plugin ordering, rollback, dynamic install/uninstall and the global facade.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachGlobal, createRouterPlus, detachGlobal } from '../dist/esm/index.js';
import { createMemoryConnection } from '../dist/esm/testing/index.js';

const pages = [{ path: '/', title: 'Home' }];

test('static plugins install in dependency and ordering order', async () => {
  const order = [];
  const plus = createRouterPlus({
    pages,
    globalKey: false,
    plugins: [
      { id: 'c', requires: ['b'], setup: () => order.push('c') },
      { id: 'a', setup: () => order.push('a') },
      { id: 'b', requires: ['a'], setup: () => order.push('b') },
      { id: 'first', before: ['a'], setup: () => order.push('first') },
    ],
  });
  await plus.ready;
  assert.deepEqual(order, ['first', 'a', 'b', 'c']);
});

test('commands report not-ready until async plugins finish', async () => {
  let release;
  const gate = new Promise(resolve => {
    release = resolve;
  });
  const plus = createRouterPlus({
    pages,
    globalKey: false,
    plugins: [{ id: 'slow', setup: async () => gate }],
  });
  plus.connect(createMemoryConnection({ initial: { pathname: '/' } }));
  const early = await plus.navigate('/');
  assert.equal(early.ok, false);
  assert.equal(early.reason, 'not-ready');
  release();
  await plus.ready;
  assert.equal((await plus.navigate('/')).ok, true);
});

test('failed dynamic setup rolls back registrations', async () => {
  const plus = createRouterPlus({ pages, globalKey: false });
  await assert.rejects(
    plus.use({
      id: 'broken',
      setup(api) {
        api.registerLinkProtocol({ scheme: 'app', resolve: () => null });
        throw new Error('setup failed');
      },
    }),
  );
  await plus.use({
    id: 'replacement',
    setup(api) {
      api.registerLinkProtocol({ scheme: 'app', resolve: () => ({ path: '/' }) });
    },
  });
});

test('uninstall refuses dependents unless cascading', async () => {
  const plus = createRouterPlus({ pages, globalKey: false });
  await plus.use({ id: 'a', setup() {} });
  await plus.use({ id: 'b', requires: ['a'], setup() {} });
  await assert.rejects(plus.unuse('a'));
  await plus.unuse('a', { cascade: true });
  await assert.rejects(plus.unuse('a'));
});

test('duplicate plugin ids and unsatisfiable dynamic ordering are rejected', async () => {
  const plus = createRouterPlus({ pages, globalKey: false });
  await plus.use({ id: 'a', setup() {} });
  await assert.rejects(plus.use({ id: 'a', setup() {} }));
  await assert.rejects(plus.use({ id: 'b', before: ['a'], setup() {} }));
});

test('global facade attaches once, rejects conflicts and detaches only its own key', () => {
  const plus = createRouterPlus({ pages, globalKey: false });
  const detach = attachGlobal(plus, '__RP_TEST__');
  assert.equal(typeof globalThis.__RP_TEST__.getContext, 'function');
  assert.equal(globalThis.__RP_TEST__.pages.ids[0], '/');

  const foreign = { foreign: true };
  globalThis.__RP_TEST_CONFLICT__ = foreign;
  assert.throws(() => attachGlobal(plus, '__RP_TEST_CONFLICT__'), /occupied/);
  assert.equal(globalThis.__RP_TEST_CONFLICT__, foreign);
  detachGlobal('__RP_TEST_CONFLICT__');
  assert.equal(globalThis.__RP_TEST_CONFLICT__, foreign);

  detach();
  assert.equal(globalThis.__RP_TEST__, undefined);
  delete globalThis.__RP_TEST_CONFLICT__;
});

test('dispose uninstalls plugins and disconnects', async () => {
  let cleaned = false;
  const plus = createRouterPlus({
    pages,
    globalKey: false,
    plugins: [
      {
        id: 'cleanup',
        setup() {
          return () => {
            cleaned = true;
          };
        },
      },
    ],
  });
  await plus.ready;
  await plus.dispose();
  assert.equal(cleaned, true);
  assert.equal(plus.connected, false);
});

test('global attachment rejects second instances and preserves foreign replacements',async()=>{
 const first=createRouterPlus({pages,globalKey:false}),second=createRouterPlus({pages,globalKey:false});
 const key='__RP_OWNER_TEST__';const release=attachGlobal(first,key);const original=globalThis[key];
 assert.throws(()=>attachGlobal(second,key),/occupied/);assert.equal(globalThis[key],original);
 const foreign={foreign:true};globalThis[key]=foreign;release();assert.equal(globalThis[key],foreign);
 delete globalThis[key];const old=attachGlobal(first,key);detachGlobal(key);const replacement=attachGlobal(second,key);const current=globalThis[key];old();assert.equal(globalThis[key],current);replacement();
 const previous=Object.getOwnPropertyDescriptor(globalThis,'window');Object.defineProperty(globalThis,'window',{value:{},configurable:true});let installed=false;
 const automatic=createRouterPlus({pages,globalKey:key});assert.throws(()=>createRouterPlus({pages,globalKey:key,plugins:[{id:'no-side-effects',setup(){installed=true;}}]}),/occupied/);assert.equal(installed,false);await automatic.dispose();
 if(previous)Object.defineProperty(globalThis,'window',previous);else delete globalThis.window;
 await first.dispose();await second.dispose();
});
