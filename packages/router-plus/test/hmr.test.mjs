import { test } from 'node:test';
import assert from 'node:assert/strict';
const entry = new URL(process.env.RP_HMR_TEST_ENTRY || '../dist/esm/index.js', import.meta.url);
const { createRouterPlus } = await import(entry);
const pages = [{ path: '/', title: 'Home' }];

test('structural HMR contract releases ownership before asynchronous cleanup', async () => {
    const oldWindow = globalThis.window;
    globalThis.window = {};
    const key = '__RP_HMR_STRUCTURAL__';
    let dispose, release;
    const gate = new Promise(resolve => { release = resolve; });
    const hot = { dispose(callback) { dispose = callback; } };
    const old = createRouterPlus({ pages, globalKey: key, hmr: hot,
      plugins: [{ id: 'pending', setup: () => gate }] });
    const ready = old.ready;
    try {
      assert.equal(typeof dispose, 'function');
      dispose();
      assert.equal(key in globalThis, false);
      const replacement = createRouterPlus({ pages, globalKey: key });
      const facade = globalThis[key];
      release();
      await ready;
      await old.dispose();
      assert.equal(globalThis[key], facade);
      await replacement.dispose();
      assert.equal(key in globalThis, false);
    } finally { release(); if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow; }
  });

test('production collision stays protected and guides developers', async () => {
  const oldWindow = globalThis.window;
  globalThis.window = {};
  const key = '__RP_HMR_PRODUCTION__';
  const plus = createRouterPlus({ pages, globalKey: key, hmr: false });
  try {
    const facade = globalThis[key];
    assert.throws(() => createRouterPlus({ pages, globalKey: key }), /hmr: import.meta.hot/);
    assert.equal(globalThis[key], facade);
    const foreign = {};
    globalThis[key] = foreign;
    await plus.dispose();
    assert.equal(globalThis[key], foreign);
  } finally {
    delete globalThis[key];
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
  }
});


test('Core disposal shares pending completion and survives reentrant disposal', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let cleaned = false;
  const plus = createRouterPlus({ pages, globalKey: false,
    plugins: [{ id: 'slow-cleanup', setup: () => async () => {
      await gate;
      cleaned = true;
    } }],
  });
  await plus.ready;
  let reentrant;
  plus.subscribe(event => { if (event.type === 'disposed') reentrant = plus.dispose(); });
  const first = plus.dispose();
  try {
    assert.equal(first, reentrant);
    assert.equal(first, plus.dispose());
    let completed = false;
    first.then(() => { completed = true; });
    await Promise.resolve();
    assert.equal(completed, false);
    assert.equal(cleaned, false);
  } finally { release(); await first; }
  assert.equal(cleaned, true);
});

for (const failing of [false, true]) {
  test(`installed Vue HMR cleanup is idempotent, including unsubscribe failure=${failing}`, async () => {
    const { createVueRouterPlus } = await import(new URL('./vue/index.js', entry));
    const callbacks = [], diagnostics = [], unmounts = [];
    const counts = { after: 0, before: 0 };
    const failure = new Error('native unsubscribe failed');
    const router = {
      currentRoute: { value: { path: '/', fullPath: '/', hash: '', matched: [], params: {} } },
      afterEach() { return () => { counts.after++; if (failing) throw failure; }; },
      beforeEach() { return () => { counts.before++; }; },
      push() {}, replace() {}, go() {},
    };
    const plus = createVueRouterPlus({ pages, router, globalKey: false,
      hmr: { dispose(callback) { callbacks.push(callback); } },
      onDiagnostic(error, stage) { diagnostics.push({ error, stage }); throw new Error('sink failed'); },
    });
    plus.install({
      config: { globalProperties: {} }, provide() {},
      onUnmount(callback) { unmounts.push(callback); },
    });
    await plus.ready;
    const traversal = plus.connection.go(1);
    callbacks.forEach(callback => callback());
    assert.deepEqual(await traversal, { status: 'cancelled' });
    assert.deepEqual(counts, { after: 1, before: 1 });
    unmounts.forEach(callback => callback());
    plus.disconnect();
    await plus.dispose();
    callbacks.forEach(callback => callback());
    assert.deepEqual(counts, { after: 1, before: 1 });
    assert.equal(diagnostics.length, failing ? 1 : 0);
    if (failing) {
      assert.equal(diagnostics[0].stage, 'hmr.dispose');
      assert.deepEqual(diagnostics[0].error.errors, [failure]);
    }
  });
}

test('Core cleanup continues after a connection unsubscribe throws', async () => {
  const diagnostics = [];
  let unsubscribed = 0, pluginStopped = 0;
  const failure = new Error('connection stop failed');
  const plus = createRouterPlus({ pages, globalKey: false,
    plugins: [{ id: 'cleanup', setup: () => () => { pluginStopped++; } }],
    onDiagnostic(error, stage) { diagnostics.push({ error, stage }); },
  });
  await plus.ready;
  plus.connect({ initial: { pathname: '/' },
    intercept() { return () => { throw failure; }; },
    subscribe() { return () => { unsubscribed++; }; },
    commit() { return { status: 'noop' }; },
  });
  await plus.dispose();
  assert.equal(plus.connected, false);
  assert.equal(unsubscribed, 1);
  assert.equal(pluginStopped, 1);
  assert.ok(diagnostics.some(item => item.error === failure && item.stage === 'connection.cleanup'));
});

test('unmounting an old Vue adapter cannot disconnect a replacement on a shared Core', async () => {
  const { createVueRouterPlus } = await import(new URL('./vue/index.js', entry));
  const core = createRouterPlus({ pages, globalKey: false });
  const unmounts = [];
  const router = () => ({
    currentRoute: { value: { path: '/', fullPath: '/', hash: '', matched: [], params: {} } },
    afterEach() { return () => {}; }, beforeEach() { return () => {}; },
    push() {}, replace() {},
  });
  const app = () => ({ config: { globalProperties: {} }, provide() {},
    onUnmount(callback) { unmounts.push(callback); } });
  const old = createVueRouterPlus({ plus: core, router: router() });
  old.install(app());
  const replacement = createVueRouterPlus({ plus: core, router: router() });
  replacement.install(app());
  unmounts[0]();
  assert.equal(core.connected, true);
  unmounts[1]();
  assert.equal(core.connected, false);
  await core.dispose();
});

test('disposed Core rejects state and retention mutations without recreating scopes', async () => {
  const plus = createRouterPlus({ pages: [{ path: '/', title: 'Home', state: { initial: { count: 1 } } }], globalKey: false });
  plus.getState();
  await plus.dispose();
  for (const operation of [() => plus.patchState({ count: 2 }), () => plus.resetState(),
    () => plus.retain(), () => plus.release()]) {
    assert.equal((await operation()).reason, 'cancelled');
  }
});
