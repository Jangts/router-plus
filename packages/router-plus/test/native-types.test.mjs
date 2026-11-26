import {test} from 'node:test';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
test('native hook/store wrappers retain generic inference and exclude manual registration from declarations',async()=>{
 await mkdir(join(root,'.tmp'),{recursive:true});
 const directory=await mkdtemp(join(root,'.tmp/rp-native-types-'));
 try {
  const consumer=`
import {createRouterPlus,type StateAccessor} from '@jangts/router-plus';
import {useRpState,useRpRef,useRpContext,useRpCallback,useReactState} from '@jangts/router-plus/react';
import {useRpRef as vueRef,useRpReactiveState,useRpComputedState,useVueState} from '@jangts/router-plus/vue';
import {createContext,useState,useRef} from 'react';
import {ref,reactive,computed} from 'vue';
import {createStore} from 'zustand/vanilla';
import {create} from 'zustand';
import {createRpZustand,registerZustandState} from '@jangts/router-plus/stores/zustand';
import {configureStore,createSlice,Tuple,type Middleware,type StoreEnhancer} from '@reduxjs/toolkit';
import {configureRpReduxStore,registerReduxState} from '@jangts/router-plus/stores/redux';
import {atom,createStore as jotaiStore} from 'jotai/vanilla';
import {createRpJotaiAtom,registerJotaiState} from '@jangts/router-plus/stores/jotai';
const plus=createRouterPlus({pages:[],globalKey:false});
const grouped=plus.execute([{kind:'state.call',id:'save'}],{signal:new AbortController().signal,timeoutMs:100});
grouped.then(result=>{if(!result.ok){const index:number=result.failedIndex;}const receipts:readonly import('@jangts/router-plus').CommandResult[]=result.results;});
// @ts-expect-error single commands retain the original result contract
plus.execute({kind:'context.read'}).then(result=>result.results);
// @ts-expect-error group options have a numeric deadline
plus.execute([],{timeoutMs:'slow'});
// @ts-expect-error existing command discriminants remain checked inside groups
plus.execute([{kind:'state.unknown'}]);
plus.subscribe(event=>{if(event.type==='state.registered'||event.type==='state.unregistered'||event.type==='state.committed'){const id:string=event.source.id;}});

const [value,set]=useRpState({category:'all',range:{from:1}}, {id:'filter',fields:{range:{query:true,encode:value=>String(value.from),decode:raw=>({from:Number(raw)})}}});
set(previous=>({...previous,category:'code'}));
// @ts-expect-error native setter retains the object type
set(1);
useRpRef<HTMLInputElement>(null,'input');
const mutable=useRpRef(1);mutable.current=2;
// @ts-expect-error native ref value type is retained
mutable.current='wrong';
const context=useRpContext(createContext('dark'),'theme');const text:string=context;
const callback=useRpCallback((value:number)=>value+1,[],'callback');const number:number=callback(1);
const count=vueRef(1,'count');const doubled=useRpComputedState(()=>count.value*2,'double');
// @ts-expect-error readonly computed stays readonly
doubled.value=3;
const existing=vueRef(doubled,'existing');
// @ts-expect-error wrapping an existing readonly ref preserves readonly typing
existing.value=4;
useRpReactiveState({tags:['a']},{id:'tags',fields:{tags:{encode:value=>value.join(','),decode:raw=>raw.split(',')}}});
const vanilla=createRpZustand(plus,createStore)<{count:number}>()(set=>({count:0}), 'counter');const n:number=vanilla.getState().count;
// @ts-expect-error inferred store state is not widened
vanilla.setState({count:'bad'});
const bound=createRpZustand(plus,create)<{count:number}>()(set=>({count:0}), 'bound');const selected:number=bound(state=>state.count);
const redux=configureRpReduxStore(plus,configureStore)({reducer:(state:{count:number}={count:0})=>state},'redux');const r:number=redux.getState().count;
const createAtom=createRpJotaiAtom(plus,atom,jotaiStore());const primitive=createAtom(1,'primitive');const derived=createAtom(get=>get(primitive)*2,'derived');
const j:number=jotaiStore().get(derived);
const stopZ=registerZustandState(plus,vanilla,{id:'existing-z',fields:{count:{encode:count=>String(count)}}});
const existingRedux=configureStore({reducer:(state:{count:number}={count:0})=>state});
registerReduxState(plus,existingRedux,{id:'existing-r',set:next=>{const count:number=next.count;void count;}});
// @ts-expect-error incompatible complete Redux state writer
registerReduxState(plus,existingRedux,{id:'bad-r',set:(next:string)=>{}});
const atomStore=jotaiStore();registerJotaiState(plus,atomStore,primitive,{id:'existing-j',set:next=>atomStore.set(primitive,next)});
registerJotaiState(plus,atomStore,derived,'readonly-j');
// @ts-expect-error readonly atoms cannot acquire a setter
registerJotaiState(plus,atomStore,derived,{id:'bad-j',set:(next:number)=>{}});
const command=atom(get=>get(primitive),(get,set,delta:number,label:string)=>{set(primitive,get(primitive)+delta);return label;});
registerJotaiState(plus,atomStore,command,{id:'command',set:next=>{atomStore.set(command,next,'set');}});
// @ts-expect-error Jotai value inference excludes unrelated setter values
registerJotaiState(plus,atomStore,command,{id:'bad-command',set:(next:string)=>{}});
const functionState=useState(()=>()=>1);useReactState(functionState,'function');
useReactState(functionState,{id:'function-codec',query:true,encode:fn=>String(fn()),decode:raw=>()=>Number(raw)});
useReactState(useRef<HTMLDivElement|null>(null),'native-ref');
useReactState((n:number,label:string)=>label+n,'native-callback');
const accessor:StateAccessor<number>={get:()=>1,set:next=>{const n:number=next;void n;}};
useReactState(accessor,{id:'accessor',encode:n=>String(n)});
// @ts-expect-error tuple values must retain their native type
useReactState(functionState,{id:'bad-tuple',encode:(value:string)=>value});
// @ts-expect-error plain values need an explicit getter
useReactState(1,'plain');
useVueState(ref(1),{id:'vue-ref',encode:n=>String(n)});
useVueState(reactive({tags:['a']}),{id:'vue-object',fields:{tags:{encode:tags=>tags.join(',')}}});
useVueState(computed(()=>1),'vue-computed');useVueState(accessor,'vue-accessor');
const vueCommand = async (fields: {name:string}, mode:'merge'|'overwrite') => ({applied:Object.keys(fields),mode});
useVueState(vueCommand,'vue-command');
useVueState(ref(vueCommand),'vue-command-ref');
// @ts-expect-error callable source inference excludes unrelated codec values
useVueState(vueCommand,{id:'bad-vue-command',encode:(value:number)=>String(value)});
const metadata=plus.inspectState('filter');const writable:boolean|undefined=metadata?.capabilities.write;
// @ts-expect-error descriptors do not expose live values
metadata?.value;
const withAction=createStore(()=>({count:1,increment:()=>1}));
registerZustandState(plus,withAction,{id:'projection',fields:{count:{query:true}}});
// @ts-expect-error callable fields are indexed as commands, not data fields
registerZustandState(plus,withAction,{id:'bad-projection',fields:{increment:{query:true}}});
const mixed=computed({get:()=>1,set:(value:string)=>{}});useVueState(mixed);
// @ts-expect-error full-value recovery requires a setter accepting the read value
useVueState(mixed,'mixed');
// @ts-expect-error existing-ref creation shorthand cannot bypass computed assignment capability
vueRef(mixed,'mixed-wrapped');
// @ts-expect-error creation registration obeys the same complete-value write constraint
useRpComputedState({get:()=>1,set:(value:string)=>{}},'mixed-created');
const inferred=configureRpReduxStore(plus,configureStore)({reducer:{count:(state:number=0)=>state}},'map');
const inferredCount:number=inferred.getState().count;
// @ts-expect-error reducer map preserves property types
const invalidCount:string=inferred.getState().count;
const thunkResult:number=inferred.dispatch(()=>3);
const slice=createSlice({name:'typed',initialState:{title:'initial'},reducers:{rename:(state,action:{payload:string})=>{state.title=action.payload;}}});
const sliceStore=configureRpReduxStore(plus,configureStore)({reducer:slice.reducer,preloadedState:{title:'loaded'}},'slice');
const title:string=sliceStore.getState().title;
// @ts-expect-error slice return state remains specific
sliceStore.getState().absent;
const middleware:Middleware<{(action:{type:'special'}):number}>=()=>next=>action=>next(action);
const middlewareStore=configureRpReduxStore(plus,configureStore)({reducer:(state:number=0)=>state,middleware:()=>new Tuple(middleware)},'middleware');
const dispatched:number=middlewareStore.dispatch({type:'special'});
const enhancer:StoreEnhancer<{marker:true}>=next=>(...args)=>({...next(...args),marker:true as const});
const enhanced=configureRpReduxStore(plus,configureStore)({reducer:(state:number=0)=>state,enhancers:defaults=>defaults().concat(enhancer)},'enhanced');
const marker:true=enhanced.marker;
const asyncDispatched:Promise<number>=enhanced.dispatch(async()=>4);
void [writable,inferredCount,thunkResult,title,dispatched,marker,asyncDispatched];
stopZ();
// @ts-expect-error manual registration is internal
plus.registerStateBridge('manual',{read:()=>1});
// @ts-expect-error RP does not export an owned-state hook
import {usePageState} from '@jangts/router-plus/react';
void [value,text,number,n,selected,r,j];
`;
  await Promise.all(['consumer.mts','consumer.cts'].map(file=>writeFile(join(directory,file),consumer)));
  try { execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--ignoreConfig','--strict','--noEmit','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2023',join(directory,'consumer.mts'),join(directory,'consumer.cts')],{cwd:root,stdio:'pipe'}); } catch(error) { throw new Error(error.stdout?.toString() ?? error.message); }
 }finally{await rm(directory,{recursive:true,force:true});}
});
