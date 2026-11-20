/**
 * Navigation, catalog, link and guard behaviour against the built ESM output.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPageLink, createRouterPlus, parsePageLink } from '../dist/esm/index.js';
import { createMemoryConnection } from '../dist/esm/testing/index.js';

const pages = [
  { id: 'home', path: '/', title: 'Home' },
  { id: 'works', path: '/works', title: 'Works', tabs: [{ id: 'all' }, { id: 'code' }], defaultTab: 'all' },
  {
    id: 'dev',
    path: '/works/development',
    title: 'Dev',
    tabs: [{ id: 'frontend' }, { id: 'backend' }],
    instanceKey: 'page',
  },
  { id: 'book', path: '/works/writing/:bookId', title: 'Book' },
  { id: 'list', path: '/list', title: 'List', retain: { max: 2 } },
];

function setup(options = {}) {
  const plus = createRouterPlus({ pages, globalKey: false, ...options });
  const connection = createMemoryConnection({ initial: { pathname: '/' } });
  plus.connect(connection);
  return { plus, connection };
}

test('catalog matches paths, params and aliases without exposing meta', () => {
  const plus = createRouterPlus({
    pages: [
      ...pages,
      { id: 'alias', path: '/old', pathAliases: ['/legacy'], title: 'Alias', meta: { secret: true } },
    ],
    globalKey: false,
  });
  assert.equal(plus.match('/works/development').page.id, 'dev');
  assert.equal(plus.match('/works/writing/abc').params.bookId, 'abc');
  assert.equal(plus.match('/legacy').page.id, 'alias');
  assert.equal(plus.match('/missing'), null);
  assert.equal(plus.pages.get('alias').meta, undefined);
  assert.equal(plus.pages.entries.some(entry => 'meta' in entry), false);
});

test('initialLocation seeds SSR and hydration context without a connection', () => {
  const plus = createRouterPlus({
    pages,
    globalKey: false,
    initialLocation: { pathname: '/works', search: '', hash: '' },
  });
  assert.equal(plus.connected, false);
  assert.equal(plus.getContext().pageId, 'works');
  assert.equal(plus.getContext().instance.instanceKey, '/works');
});

test('path targets do not require page ids and unregistered paths keep a null pageId', async () => {
  const { plus } = setup();
  const result = await plus.navigate('/not-registered');
  assert.equal(result.ok, true);
  assert.equal(plus.getContext().pageId, null);
  assert.equal(plus.getContext().instance, null);
});

test('page id targets build params and reject unknown pages or tabs', async () => {
  const { plus } = setup();
  const detail = await plus.navigate({ page: 'book', params: { bookId: 'abc' } });
  assert.equal(detail.ok, true);
  assert.equal(plus.getContext().params.bookId, 'abc');

  const unknown = await plus.navigate({ page: 'missing' });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown-page');

  const invalidTab = await plus.navigate({ path: '/works', tab: 'nope' });
  assert.equal(invalidTab.ok, false);
  assert.equal(invalidTab.reason, 'invalid-tab');
});

test('unsafe schemes and protocol-relative paths are rejected with no side effects', async () => {
  const { plus, connection } = setup();
  const history = connection.history.length;
  assert.equal((await plus.navigate('javascript:alert(1)')).reason, 'invalid-target');
  assert.equal((await plus.navigate('//evil.example/path')).reason, 'invalid-target');
  assert.equal(connection.history.length, history);
  assert.equal(plus.getContext().pathname, '/');
});

test('query pairs keep order and duplicates', async () => {
  const { plus } = setup();
  const result = await plus.navigate('/works?tag=a&tag=b&q=hello%20world');
  assert.equal(result.ok, true);
  const context = plus.getContext();
  assert.equal(context.query.tag, 'a');
  assert.deepEqual(
    context.queryAll.filter(([key]) => key === 'tag').map(([, value]) => value),
    ['a', 'b'],
  );
  assert.equal(context.query.q, 'hello world');
});

test('explicit tabs are stored in history state and restored on traversal', async () => {
  const { plus, connection } = setup();
  await plus.navigate({ page: 'works', tab: 'code' });
  assert.equal(plus.getTab(), 'code');
  const record = connection.location.state.routerPlus;
  assert.equal(record.tab, 'code');
  assert.equal(record.pageId, 'works');

  await plus.navigate('/works/development');
  assert.equal(plus.getContext().pageId, 'dev');
  await plus.back();
  assert.equal(plus.getContext().pageId, 'works');
  assert.equal(plus.getTab(), 'code');
});

test('leave guards block without committing', async () => {
  const plus = createRouterPlus({
    pages: [
      { path: '/a', title: 'A', guards: { beforeLeave: () => false } },
      { path: '/b', title: 'B' },
    ],
    globalKey: false,
  });
  const connection = createMemoryConnection({ initial: { pathname: '/a' } });
  plus.connect(connection);
  const result = await plus.navigate('/b');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'blocked');
  assert.equal(plus.getContext().pathname, '/a');
});

test('enter guards redirect and count redirects', async () => {
  const plus = createRouterPlus({
    pages: [
      { path: '/a', title: 'A', guards: { beforeEnter: () => ({ redirect: '/b' }) } },
      { path: '/b', title: 'B' },
    ],
    globalKey: false,
  });
  const connection = createMemoryConnection({ initial: { pathname: '/' } });
  plus.connect(connection);
  const result = await plus.navigate('/a');
  assert.equal(result.ok, true);
  assert.equal(plus.getContext().pathname, '/b');
});

test('afterEnter failures keep the committed address and report the error', async () => {
  const plus = createRouterPlus({
    pages: [
      {
        path: '/b',
        title: 'B',
        guards: {
          afterEnter: () => {
            throw new Error('after failed');
          },
        },
      },
    ],
    globalKey: false,
  });
  const connection = createMemoryConnection({ initial: { pathname: '/' } });
  plus.connect(connection);
  const result = await plus.navigate('/b');
  assert.equal(result.ok, false);
  assert.equal(result.committed, true);
  assert.equal(result.stage, 'afterEnter');
  assert.equal(plus.getContext().pathname, '/b');
});

test('superseded navigation is cancelled by the newer target', async () => {
  let release;
  const gate = new Promise(resolve => {
    release = resolve;
  });
  const plus = createRouterPlus({
    pages: [
      { path: '/', title: 'Home' },
      {
        path: '/slow',
        title: 'Slow',
        guards: {
          beforeEnter: async () => {
            await gate;
            return true;
          },
        },
      },
      { path: '/fast', title: 'Fast' },
    ],
    globalKey: false,
  });
  const connection = createMemoryConnection({ initial: { pathname: '/' } });
  plus.connect(connection);
  const slow = plus.navigate('/slow');
  const fast = plus.navigate('/fast');
  release();
  const [slowResult, fastResult] = await Promise.all([slow, fast]);
  assert.equal(fastResult.ok, true);
  assert.equal(slowResult.ok, false);
  assert.equal(slowResult.reason, 'cancelled');
  assert.equal(plus.getContext().pathname, '/fast');
});

test('page link codec uses configured scheme and rejects duplicate or unknown keys', () => {
  const link = createPageLink({ path: '/works', tab: 'code' }, { scheme: 'app' });
  assert.equal(link, 'app://page?path=%2Fworks&tab=code');
  assert.deepEqual(parsePageLink(link, { scheme: 'app' }), { path: '/works', tab: 'code' });
  assert.equal(parsePageLink(link, { scheme: 'other' }), null);
  assert.equal(parsePageLink('app://page?path=%2Fa&path=%2Fb', { scheme: 'app' }), null);
  assert.equal(parsePageLink('app://page?path=%2Fa&extra=1', { scheme: 'app' }), null);
});

test('configured link protocols resolve synchronously and guard against cycles', () => {
  const plus = createRouterPlus({
    pages,
    globalKey: false,
    plugins: [
      {
        id: 'protocol',
        setup(api) {
          api.registerLinkProtocol({
            scheme: 'app',
            resolve(value) {
              const target = parsePageLink(value, { scheme: 'app' });
              return target ?? null;
            },
          });
        },
      },
    ],
  });
  return plus.ready.then(async () => {
    const connection = createMemoryConnection({ initial: { pathname: '/' } });
    plus.connect(connection);
    const result = await plus.navigate('app://page?path=%2Fworks&tab=code');
    assert.equal(result.ok, true);
    assert.equal(plus.getContext().pageId, 'works');
    assert.equal(plus.getTab(), 'code');
  });
});

test('initial address restores versioned history tab before a connection mounts',async()=>{
 const plus=createRouterPlus({pages,globalKey:false,initialLocation:{pathname:'/works',search:'',hash:'',state:{routerPlus:{version:1,path:'/works',pageId:'works',instanceKey:'/works',tab:'code'}}}});
 assert.equal(plus.getTab(),'code');await plus.dispose();
});
