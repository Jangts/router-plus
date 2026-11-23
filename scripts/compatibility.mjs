/**
 * Exercise the packed SDK with current dependencies or an isolated peer-minimum installation.
 * Run after npm run build. --minimum uses the public registry; all fixtures/cache live in .tmp.
 * No application services, root dependency changes or browser previews are performed.
 */
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const minimum = process.argv.includes('--minimum');
/** Declared peer lower bounds, kept explicit so matrix changes remain reviewable. */
const peers = {
  react: '18.0.0',
  'react-dom': '18.0.0',
  'react-router-dom': '6.0.0',
  vue: '3.5.0',
  'vue-router': '4.0.16',
  '@reduxjs/toolkit': '2.0.0',
  jotai: '2.0.0',
  zustand: '5.0.0',
  '@types/react': '18.0.0',
  '@types/react-dom': '18.0.0',
};
const temporary = await mkdtemp(path.join(root, '.tmp/rp-compat-'));
try {
  const packed = JSON.parse(
    execFileSync(
      'npm',
      ['pack', '.', '--json', '--ignore-scripts', '--pack-destination', temporary],
      {
        cwd: root,
        env: { ...process.env, npm_config_cache: path.join(temporary, 'cache') },
        encoding: 'utf8',
      },
    ),
  )[0];
  const archive = path.join(temporary, packed.filename);
  if (minimum) {
    await writeFile(
      path.join(temporary, 'package.json'),
      JSON.stringify({
        private: true,
        dependencies: { ...peers, '@jangts/router-plus': `file:${archive}` },
      }),
    );
    execFileSync(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        '--registry=https://registry.npmjs.org',
      ],
      {
        cwd: temporary,
        env: { ...process.env, npm_config_cache: path.join(temporary, 'cache') },
        stdio: 'pipe',
      },
    );
  } else {
    const sdk = path.join(temporary, 'node_modules/@jangts/router-plus');
    await mkdir(sdk, { recursive: true });
    execFileSync('tar', ['-xzf', archive, '--strip-components=1', '-C', sdk]);
  }
  const consumer = `import {createRouterPlus, type StateInspection} from '@jangts/router-plus';
import {useRpState,useRpRef as reactRef,createReactRouterPlus} from '@jangts/router-plus/react';
import {useVueState,useRpRef as vueRef,useRpReactiveState,useRpComputedState} from '@jangts/router-plus/vue';
import {ref} from 'vue';
import {createStore as nativeZustand} from 'zustand/vanilla';
import {registerZustandState} from '@jangts/router-plus/stores/zustand';
import {configureStore} from '@reduxjs/toolkit';
import {configureRpReduxStore} from '@jangts/router-plus/stores/redux';
import {usePageQuery as reactQuery,RouterPlusOutlet,RouterPlusLink as ReactLink,type RetainedHost} from '@jangts/router-plus/react';
import {usePageQuery as vueQuery} from '@jangts/router-plus/vue';
void ReactLink({to:'/items',reloadDocument:true,disabled:true});
const host:RetainedHost=()=>null;void RouterPlusOutlet({host});
const reactWrite:Promise<unknown>=reactQuery({tags:['one','two']})[1](q=>{q.set('q','value');return q;});
const reactPatch:Promise<unknown>=reactQuery()[1].patch({page:undefined,tags:['one','two'],keyword:''});
const vuePatch:Promise<unknown>=vueQuery().patchQuery({page:undefined,tags:[]});void [reactPatch,vuePatch];
const vueWrite:Promise<unknown>=vueQuery().setQuery({tags:['one','two']});void [reactWrite,vueWrite];
const dateRef=vueRef(new Date(),{id:'date',query:true,encode:d=>d.toISOString(),decode:raw=>new Date(raw.get('date')??0)});
const mapRef=vueRef(new Map<string,number>(),{id:'map',query:'selected',encode:m=>JSON.stringify([...m]),decode:raw=>new Map<string,number>(JSON.parse(raw.get('selected')??'[]'))});
const objectRef=vueRef({term:''},{id:'object',query:'filter',encode:v=>JSON.stringify(v),decode:raw=>JSON.parse(raw.get('filter')??'{"term":""}')});void [dateRef,mapRef,objectRef];
// @ts-expect-error query updater callbacks are synchronous
reactQuery()[1](async q=>q);
// @ts-expect-error dependency observation must return synchronous cleanup
vueRef('overview',{id:'bad-observe',observe:async()=>()=>{}});
const observedRef=vueRef('overview',{id:'observed',observe:notify=>{notify();return ()=>{};}});void observedRef;
const readyRef=vueRef('overview',{id:'tab',query:true,history:'push',omitDefault:true,ready:()=>true});void readyRef;
// @ts-expect-error readiness cannot be an asynchronous operation
vueRef('overview',{id:'bad-ready',ready:async()=>true});
// @ts-expect-error history policy is a closed set
vueRef('overview',{id:'bad-history',history:'append'});
const mapStore=nativeZustand(()=>new Map<string,number>());
registerZustandState(createRouterPlus({pages:[],globalKey:false}),mapStore,{id:'map-store',query:'m',encode:value=>JSON.stringify([...value]),decode:query=>new Map<string,number>(JSON.parse(query.get('m')??'[]'))});
const RequiredRouter=(_props:{required:string})=>null;
createReactRouterPlus({router:[RequiredRouter,{required:'yes'}],pages:[],globalKey:false,disposeOnUnmount:true});
// @ts-expect-error constructor props remain checked on legacy routers too
createReactRouterPlus({router:[RequiredRouter],pages:[],globalKey:false});
// @ts-expect-error malformed router values are not widened through missing native Data Router types
createReactRouterPlus({router:1,pages:[],globalKey:false});
const plus=createRouterPlus({pages:[],globalKey:false});
plus.execute([{kind:'query.patch',patch:{page:undefined,tags:['one']},options:{replace:true}}]);
const corePatch:Promise<unknown>=plus.patchQuery({page:undefined,tags:['one']});void corePatch;
reactQuery()[1](q=>({keyword:q.get('keyword')??'',tags:['a']}));
const store=configureRpReduxStore(plus,configureStore)({reducer:{count:(state:number=0)=>state}},'count');
const count:number=store.getState().count;
// @ts-expect-error inferred reducer state is not a string
const wrong:string=store.getState().count;
const result:number=store.dispatch(()=>3);
const meta:StateInspection|null=plus.inspectState('count');
plus.execute([{kind:'state.read',key:'count'}],{timeoutMs:100}).then(result=>{if(!result.ok){const index:number=result.failedIndex;}});
// @ts-expect-error sequence commands retain their discriminants
plus.execute([{kind:'state.missing'}]);
${minimum ? 'const empty=reactRef<number>();empty.current=1;' : '// @ts-expect-error React 19 requires an explicit initial value\nreactRef<number>();'}
const reactValue=reactRef(1);reactValue.current=2;
// @ts-expect-error native mutable refs retain their value type
reactValue.current='wrong';
const vueValue=vueRef({count:1});const vueNumber:number=vueValue.value.count;
// @ts-expect-error wrapped Vue refs do not degrade to any
const badVueNumber:string=vueValue.value.count;
const reactiveValue=useRpReactiveState({count:1});
// @ts-expect-error reactive return type remains native and specific
const badReactive:string=reactiveValue.count;
const computedValue=useRpComputedState(()=>1);
// @ts-expect-error computed return type remains specific
const badComputed:string=computedValue.value;
useVueState(ref(1),'value');void [count,result,meta,useRpState,vueNumber];`;
  for (const extension of ['mts', 'cts'])
    await writeFile(path.join(temporary, 'consumer.' + extension), consumer);
  const recipe = await readFile(path.join(root, 'docs/application-integration.md'), 'utf8');
  const recipeFiles = [];
  const excludedRecipes = [];
  const recipeCapabilities = {
    'react-router-data-router': {
      available: !minimum,
      requires: 'react-router-dom >=6.4',
      reason:
        'Declared minimum react-router-dom 6.0.0 supports declarative routing but has no createBrowserRouter API',
    },
  };
  for (const [index, match] of [...recipe.matchAll(/```(?:ts|tsx)\n([\s\S]*?)```/g)].entries()) {
    const requirement = recipe.slice(0, match.index).match(/<!-- requires: ([a-z-]+) -->\s*$/)?.[1];
    if (requirement) {
      const capability = recipeCapabilities[requirement];
      if (!capability) throw new Error(`Unknown recipe capability: ${requirement}`);
      if (!capability.available) {
        excludedRecipes.push({
          recipe: `recipe-${index}.tsx`,
          capability: requirement,
          requires: capability.requires,
          reason: capability.reason,
        });
        continue;
      }
    }
    const filename = path.join(temporary, `recipe-${index}.tsx`);
    await writeFile(filename, match[1]);
    recipeFiles.push(filename);
  }
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--ignoreConfig',
      '--strict',
      '--skipLibCheck',
      '--noEmit',
      '--jsx',
      'react-jsx',
      '--target',
      'ES2023',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      path.join(temporary, 'consumer.mts'),
      path.join(temporary, 'consumer.cts'),
      ...recipeFiles,
    ],
    { cwd: temporary, stdio: 'pipe' },
  );
  await writeFile(
    path.join(temporary, 'runtime.mjs'),
    `import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRouterPlus} from '@jangts/router-plus';
import * as react from '@jangts/router-plus/react';import * as vue from '@jangts/router-plus/vue';
import {createStore} from 'zustand/vanilla';import {registerZustandState} from '@jangts/router-plus/stores/zustand';
import {configureStore} from '@reduxjs/toolkit';import {configureRpReduxStore} from '@jangts/router-plus/stores/redux';
import {atom,createStore as atoms} from 'jotai/vanilla';import {createRpJotaiAtom} from '@jangts/router-plus/stores/jotai';
import {createReactRouterPlus,useRpState} from '@jangts/router-plus/react';import {createVueRouterPlus,useVueState} from '@jangts/router-plus/vue';
const require=createRequire(import.meta.url);
const React=require('react'),{renderToString}=require('react-dom/server'),{MemoryRouter}=require('react-router-dom');
const assembled=createReactRouterPlus({router:React.createElement(MemoryRouter,{initialEntries:['/a']}),pages:[{path:'/a',title:'A'}],globalKey:false,initialLocation:{pathname:'/a'}});
function Counter(){const [value]=useRpState(1);return React.createElement('span',null,value);}
assert.match(renderToString(React.createElement(assembled.Provider,null,React.createElement(Counter))),/1/);await assembled.dispose();
const Vue=require('vue'),nativeVueRouter=require('vue-router'),router=nativeVueRouter.createRouter({history:nativeVueRouter.createMemoryHistory(),routes:[{path:'/a',component:{render:()=>null}}]});await router.push('/a');
const vp=createVueRouterPlus({router,pages:[{path:'/a',title:'A'}],globalKey:false}),app=Vue.createSSRApp({render:()=>null});app.use(vp);const lifetime=Vue.effectScope();const counter=Vue.ref(1);app.runWithContext(()=>lifetime.run(()=>useVueState(counter,'vueCount')));assert.equal(vp.inspectState('vueCount').scope,'global');await vp.setState(2,'vueCount');assert.equal(counter.value,2);assert.equal((await vp.execute([{kind:'state.set',key:'vueCount',value:3}])).ok,true);assert.equal(counter.value,3);lifetime.stop();await vp.dispose();
for(const sub of ['','/react','/vue','/overlay','/stores/zustand','/stores/redux','/stores/jotai','/testing']){const esm=await import('@jangts/router-plus'+sub),cjs=require('@jangts/router-plus'+sub);assert.deepEqual(Object.keys(esm).sort(),Object.keys(cjs).sort());}
const plus=createRouterPlus({pages:[],globalKey:false});const store=createStore(()=>({count:1}));const stop=registerZustandState(plus,store,'z');await plus.setState(2,'z/count');assert.equal(store.getState().count,2);assert.equal((await plus.execute([{kind:'state.set',key:'z/count',value:3},{kind:'state.read',key:'z/count'}])).ok,true);assert.equal(store.getState().count,3);
const redux=configureRpReduxStore(plus,configureStore)({reducer:(state=0)=>state},'r');await plus.setState(4,'r');assert.equal(redux.getState(),4);
const atomStore=atoms(),value=createRpJotaiAtom(plus,atom,atomStore)(1,'j');await plus.setState(5,'j');assert.equal(atomStore.get(value),5);assert.equal(plus.inspectState().length,3+1);stop();await plus.dispose();
const {createMemoryConnection}=await import('@jangts/router-plus/testing');
const address=createRouterPlus({pages:[{id:'detail',path:'/items/:id',title:'Detail'}],globalKey:false});address.connect(createMemoryConnection({initial:{pathname:'/items/one',search:'?keep=yes&page=2',hash:'#anchor'}}));
assert.equal((await address.patchQuery({page:undefined,tags:['one','two'],keyword:''},{replace:true})).ok,true);
assert.deepEqual(new URLSearchParams(address.getContext().search).getAll('tags'),['one','two']);assert.equal(address.getContext().hash,'#anchor');
assert.equal((await address.execute([{kind:'query.patch',patch:{keyword:undefined},options:{replace:true}}])).ok,true);
assert.equal(address.resolveLink({page:'detail',params:{id:'two'},hash:'#chapter'})?.href,'/items/two#chapter');
const catalog=createStore(()=>({loaded:false})),selection=createStore(()=>({section:'default'}));
await address.navigate('/items/one?section=two');
const releaseSelection=registerZustandState(address,selection,{id:'selection',fields:{section:{query:true}},ready:()=>catalog.getState().loaded,observe:notify=>catalog.subscribe(notify)});
await address.whenReady();assert.equal(selection.getState().section,'default');catalog.setState({loaded:true});await address.whenReady();assert.equal(selection.getState().section,'two');releaseSelection();await address.dispose();
console.log('Packed ESM/CJS imports, inference and native store writes passed.');`,
  );
  execFileSync(process.execPath, [path.join(temporary, 'runtime.mjs')], {
    cwd: temporary,
    stdio: 'pipe',
  });
  console.log(
    JSON.stringify({
      matrix: minimum ? 'declared-peer-minima' : 'installed-peers',
      ...(minimum ? { peers } : {}),
      recipes: { checked: recipeFiles.length, excluded: excludedRecipes },
      artifact: packed.shasum,
      result: 'passed',
    }),
  );
} catch (error) {
  const output = (error.stdout?.toString() ?? '') + (error.stderr?.toString() ?? '');
  process.stderr.write(output || `${error.stack ?? error}\n`);
  process.exitCode = 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
