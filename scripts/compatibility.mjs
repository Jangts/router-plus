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
import {configureStore} from '@reduxjs/toolkit';
import {configureRpReduxStore} from '@jangts/router-plus/stores/redux';
const RequiredRouter=(_props:{required:string})=>null;
createReactRouterPlus({router:[RequiredRouter,{required:'yes'}],pages:[],globalKey:false});
// @ts-expect-error constructor props remain checked on legacy routers too
createReactRouterPlus({router:[RequiredRouter],pages:[],globalKey:false});
// @ts-expect-error malformed router values are not widened through missing native Data Router types
createReactRouterPlus({router:1,pages:[],globalKey:false});
const plus=createRouterPlus({pages:[],globalKey:false});
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
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--ignoreConfig',
      '--strict',
      '--skipLibCheck',
      '--noEmit',
      '--target',
      'ES2023',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      path.join(temporary, 'consumer.mts'),
      path.join(temporary, 'consumer.cts'),
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
