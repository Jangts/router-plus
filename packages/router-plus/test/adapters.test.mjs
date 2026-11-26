/**
 * Adapter entries must import cleanly in Node and expose the documented helpers.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterPlus } from '../dist/esm/index.js';
import * as react from '../dist/esm/react/index.js';
import * as vue from '../dist/esm/vue/index.js';
import * as overlay from '../dist/esm/dom/index.js';
import { createPiniaPageStateBridge } from '../dist/esm/stores/pinia.js';

import {
  createFakeBridge,
  createMemoryConnection,
  createMemoryHost,
} from '../dist/esm/testing/index.js';

const pages = [
  { id: 'home', path: '/', title: 'Home' },
  { id: 'works', path: '/works', title: 'Works', tabs: [{ id: 'all' }] },
];

test('react entry exposes provider, hooks, link, boundary and route generator', () => {
  assert.equal(typeof react.createReactProvider, 'function');
  assert.equal(typeof react.usePageContext, 'function');
  assert.equal(typeof react.usePageQuery, 'function');
  assert.equal(typeof react.RouterPlusLink, 'function');
  assert.equal(typeof react.RouterPlusBoundary, 'function');
  assert.equal(typeof react.createReactRoutes, 'function');
  const routes = react.createReactRoutes(pages, {
    components: { home: () => null },
  });
  assert.equal(routes.length, 2);
  assert.equal(routes[0].name, 'home');
  assert.equal(routes[0].meta.pageId, 'home');
});

test('vue entry exposes plugin, composables, components and route generator', () => {
  assert.equal(typeof vue.createVueRouterPlus, 'function');
  assert.equal(typeof vue.usePageContext, 'function');
  assert.equal(typeof vue.RouterPlusLink, 'object');
  assert.equal(typeof vue.RouterPlusView, 'object');
  assert.equal(typeof vue.createVueRoutes, 'function');
  const routes = vue.createVueRoutes(pages);
  assert.equal(routes.length, 2);
  assert.equal(routes[0].name, 'home');
});

test('vue connection commits through a structural router', async () => {
  let current = { path: '/', fullPath: '/', hash: '' };
  const afterEach = new Set();
  const router = {
    get currentRoute() {
      return { value: current };
    },
    afterEach(callback) {
      afterEach.add(callback);
      return () => afterEach.delete(callback);
    },
    async push(target) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(target.query ?? {})) {
        if (Array.isArray(value)) for (const item of value) query.append(key, item);
        else if (value !== undefined) query.set(key, String(value));
      }
      const search = query.toString();
      current = {
        path: target.path,
        fullPath: `${target.path}${search ? `?${search}` : ''}${target.hash ?? ''}`,
        hash: target.hash ?? '',
        state: target.state,
      };
      for (const callback of afterEach) callback(current, current);
    },
  };
  const plus = createRouterPlus({ pages, globalKey: false });
  const plugin = vue.createVueRouterPlus({ plus, router });
  plugin.install({ provide() {}, config: { globalProperties: {} } });
  const result = await plus.navigate({ page: 'works', tab: 'all' });
  assert.equal(result.ok, true);
  assert.equal(plus.getContext().pageId, 'works');
  assert.equal(plus.getTab(), 'all');
  plugin.disconnect();
  await plus.dispose();
});

test('overlay entry imports without DOM globals and exposes the renderer', () => {
  assert.equal(typeof overlay.createDomRuntime, 'function');
  assert.equal(typeof overlay.installDomRuntime, 'function');
  assert.equal(typeof overlay.mountOverlay, 'function');
  assert.match(overlay.overlayStyles, /rp-overlay-root/);
});

test('history bridge reports framework-bypassing pushState and restores on detach', () => {
  const plus = createRouterPlus({ pages, globalKey: false });
  const target = {
    location: { pathname: '/', search: '', hash: '' },
    history: {
      state: undefined,
      pushState(data, _unused, url) {
        this.state = data;
        if (url) {
          const parsed = new URL(url, 'http://router-plus.local');
          target.location = { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash };
        }
      },
      replaceState(data, unused, url) {
        this.pushState(data, unused, url);
      },
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const originalPush = target.history.pushState;
  const detach = overlay.installHistoryBridge(plus, target);
  target.history.pushState({}, '', '/works');
  assert.equal(plus.getContext().pageId, 'works');
  detach();
  assert.equal(target.history.pushState, originalPush);
});

test('store helpers map slices without taking ownership', () => {
  const store = { value: 1 };
  const bridge = createPiniaPageStateBridge({
    store,
    select: current => current.value,
    patch: (current, value) => {
      current.value = value;
    },
  });
  assert.equal(bridge.read(), 1);
  bridge.write(2);
  assert.equal(store.value, 2);

  const atom = { value: 1 };
  const jotai = { read: () => atom.value, write: value => { atom.value = value; } };
  assert.equal(jotai.read(), 1);
  jotai.write(3);
  assert.equal(atom.value, 3);
});

test('testing helpers provide a real connection, host lifecycle and fake bridge', async () => {
  const plus = createRouterPlus({ pages, globalKey: false });
  const connection = createMemoryConnection({ initial: { pathname: '/' } });
  plus.connect(connection);
  const host = createMemoryHost();
  plus.registerHost(host);
  await plus.whenReady();
  assert.deepEqual(host.calls, ['mount', 'activate']);
  assert.equal((await plus.navigate('/works')).ok, true);
  assert.equal(connection.location.pathname, '/works');

  const bridge = createFakeBridge({ value: 1 });
  plus.registerStateBridge('fake', bridge);
  assert.deepEqual(plus.getState('fake'), { value: 1 });
  bridge.set({ value: 2 });
  assert.deepEqual(plus.getState('fake'), { value: 2 });
});
