import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm,mkdir,access,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);

test('all JavaScript exports match across ESM/CJS and CSS is a real asset',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));let pairs=0;
 assert.equal((await import('../dist/esm/index.js')).ROUTER_PLUS_VERSION,manifest.version);
 for(const [key,entry] of Object.entries(manifest.exports)){
  if(typeof entry==='string'){assert.match(await readFile(new URL('../'+entry,import.meta.url),'utf8'),/rp-overlay-root/);assert.ok(manifest.sideEffects.includes('**/*.css'));continue;}
  const esm=await import(new URL('../'+entry.import,import.meta.url));const common=require('../'+entry.require);assert.deepEqual(Object.keys(esm).sort(),Object.keys(common).sort(),key);await readFile(new URL('../'+entry.types,import.meta.url));pairs++;
 }
 assert.equal(pairs,8);
 execFileSync(process.execPath,['--input-type=module','--eval',`import {registerHooks,createRequire} from 'node:module';registerHooks({resolve(spec,ctx,next){if(/^(react|react-dom|react-router-dom|vue|vue-router)(\\/|$)/.test(spec))throw Error('Framework dependency in core');return next(spec,ctx)}});const core=await import('@jangts/router-plus');createRequire(import.meta.url)('@jangts/router-plus');core.createRouterPlus({pages:[],globalKey:false});`],{cwd:root,stdio:'pipe'});
});

test('NodeNext ESM and CommonJS consumers typecheck the public entries',async()=>{
 await mkdir(join(root,'.tmp'),{recursive:true});const directory=await mkdtemp(join(root,'.tmp/router-plus-types-'));
 try{
  await writeFile(join(directory,'consumer.mts'),`import {createRouterPlus,type RouterPlus} from '@jangts/router-plus';import {createReactProvider} from '@jangts/router-plus/react';import {createVueRouterPlus} from '@jangts/router-plus/vue';import {useLocation,useNavigate} from 'react-router-dom';createReactProvider({useLocation,useNavigate});const plus:RouterPlus=createRouterPlus({pages:[],globalKey:false});void plus;void createReactProvider;void createVueRouterPlus;\n// @ts-expect-error invalid tab argument\nplus.setTab(1);`);
  await writeFile(join(directory,'consumer.cts'),`import core=require('@jangts/router-plus');import react=require('@jangts/router-plus/react');const plus:core.RouterPlus=core.createRouterPlus({pages:[],globalKey:false});void plus;void react;`);
  await writeFile(join(directory,'assembly.tsx'),`import {BrowserRouter,createMemoryRouter} from 'react-router-dom';import {createReactRouterPlus} from '@jangts/router-plus/react';import {createVueRouterPlus} from '@jangts/router-plus/vue';import {createRouter,createMemoryHistory} from 'vue-router';const plus=createReactRouterPlus({router:<BrowserRouter basename="/"/>,pages:[],globalKey:false});const tree=<plus.Provider><div/></plus.Provider>;plus.navigate('/');createReactRouterPlus({router:createMemoryRouter([]),pages:[],globalKey:false});createVueRouterPlus({router:createRouter({history:createMemoryHistory(),routes:[]}),pages:[],globalKey:false}).navigate('/');void tree;
createReactRouterPlus({router:[BrowserRouter,{basename:'/'}],pages:[],globalKey:false});
createReactRouterPlus({router:[BrowserRouter],pages:[],globalKey:false});
const RequiredRouter=(_props:{required:string})=>null;
createReactRouterPlus({router:[RequiredRouter,{required:'yes'}],pages:[],globalKey:false});
// @ts-expect-error invalid native prop type
createReactRouterPlus({router:[BrowserRouter,{basename:123}],pages:[]});
// @ts-expect-error unknown native prop
createReactRouterPlus({router:[BrowserRouter,{unknownProp:true}],pages:[]});
// @ts-expect-error required props cannot be omitted
createReactRouterPlus({router:[RequiredRouter],pages:[]});
// @ts-expect-error object shorthand is not supported
createReactRouterPlus({router:{component:BrowserRouter,props:{}},pages:[]});
// @ts-expect-error a component constructor is not a router element
createReactRouterPlus({router:BrowserRouter,pages:[]});
// @ts-expect-error pages are required when creating the core
createReactRouterPlus({router:<BrowserRouter/>});`);
  await writeFile(join(directory,'overlay-types.ts'),`import {createRouterPlus} from '@jangts/router-plus';import {mountOverlay,type OverlayTheme} from '@jangts/router-plus/overlay';import {RouterPlusOverlay,type HighlightComponentProps,type OverlayTheme as ReactTheme} from '@jangts/router-plus/react';import {RouterPlusOverlay as VueOverlay,type OverlayTheme as VueTheme} from '@jangts/router-plus/vue';import {createElement} from 'react';import {h} from 'vue';const theme:OverlayTheme={zIndex:'var(--layer)',highlightRadius:0,highlightPadding:'calc(2px + 1px)',highlightBorderColor:'red',highlightBorderWidth:1,maskColor:'transparent'};const rt:ReactTheme=theme;const vt:VueTheme=theme;const plus=createRouterPlus({pages:[],globalKey:false});const release=mountOverlay(plus,{theme,injectStyles:false,className:'app'});release.update({theme:{zIndex:{max:59}}});release.update({theme:{zIndex:{min:20,max:58}}});release.update({theme:{zIndex:0}});release();const Highlight=({width,height,left,top,context}:HighlightComponentProps)=>createElement('div',{style:{width,height}},context.highlight.message);const run=async(props:HighlightComponentProps)=>{await props.context.next();await props.context.next(-2);};void run;createElement(RouterPlusOverlay,{theme:rt,highlightComponent:Highlight});plus.highlight('target',{placement:'left-top'});plus.startTour([{target:'target',message:'A',placement:'bottom-auto'}]);h(VueOverlay,{theme:vt});
// @ts-expect-error unknown placement\nplus.highlight('target',{placement:'top-middle'});\n// @ts-expect-error CSS length cannot be a boolean
mountOverlay(plus,{theme:{highlightPadding:false}});`);
  execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--ignoreConfig','--jsx','react-jsx','--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','es2023',join(directory,'consumer.mts'),join(directory,'consumer.cts'),join(directory,'assembly.tsx'),join(directory,'overlay-types.ts')],{cwd:root,stdio:'pipe'});
 }catch(error){throw new Error(error.stdout?.toString() || error.message,{cause:error});}finally{await rm(directory,{recursive:true,force:true});}
});

test('compiled output excludes modules removed or renamed in source',async()=>{
 for(const file of ['dist/esm/core/page-tab.js','dist/esm/core/page-tab.d.ts','dist/cjs/core/page-tab.js'])await assert.rejects(access(new URL('../'+file,import.meta.url)));
});

test('every generated file derives from a current source or an explicit generated asset',async()=>{
 const walk=async(directory)=>{const items=await readdir(new URL('../'+directory+'/',import.meta.url),{withFileTypes:true});return (await Promise.all(items.map(item=>item.isDirectory()?walk(directory+'/'+item.name):directory+'/'+item.name))).flat();};
 const sources=(await walk('src')).filter(file=>file.endsWith('.ts'));const expected=sources.flatMap(file=>{const name=file.slice(4,-3);return ['dist/esm/'+name+'.js','dist/esm/'+name+'.d.ts','dist/cjs/'+name+'.js'];});expected.push('dist/esm/package.json','dist/overlay.css');assert.deepEqual((await walk('dist')).sort(),expected.sort());
});
