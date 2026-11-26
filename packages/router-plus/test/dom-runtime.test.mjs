import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><main id="a"><button data-router-plus-target="same">A</button></main><main id="b"><button data-router-plus-target="same">B</button></main>',{pretendToBeVisual:true});
for(const key of ['window','document','Document','Element','HTMLElement','ShadowRoot','MutationObserver','requestAnimationFrame','cancelAnimationFrame'])Object.defineProperty(globalThis,key,{value:typeof dom.window[key]==='function'&&key.includes('AnimationFrame')?dom.window[key].bind(dom.window):dom.window[key],configurable:true});
const {createRouterPlus}=await import('../dist/esm/index.js');
const {createMemoryConnection}=await import('../dist/esm/testing/index.js');
const {createDomRuntime,installDomRuntime,mountOverlay}=await import('../dist/esm/dom/index.js');
const pages=[{path:'/a',title:'A',retain:true},{path:'/b',title:'B',retain:true}];
const rect={top:10,left:10,bottom:30,right:70,width:60,height:20,x:10,y:10,toJSON(){return{};}};
for(const button of document.querySelectorAll('button')) {button.getClientRects=()=>[rect];button.getBoundingClientRect=()=>rect;}
const frame=()=>new Promise(r=>setTimeout(r,30));

test('DOM runtime uses the bound host root instead of another page target',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));plus.registerHost({root:()=>document.getElementById('a')});
 const dispose=installDomRuntime(plus,{root:document});await plus.whenReady();await plus.highlight('same');assert.equal(plus.getHighlight().element.textContent,'A');
 await plus.navigate('/b');plus.registerHost({root:()=>document.getElementById('b')});await plus.highlight('same');assert.equal(plus.getHighlight().element.textContent,'B');dispose();await plus.dispose();
});
test('DOM wait cancellation, rectangular anchors and focus restoration are functional',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const release=installDomRuntime(plus);await plus.whenReady();
 const pending=plus.highlight('later',{waitForTarget:true});await plus.clearHighlight();assert.equal((await pending).ok,false);assert.equal(plus.getHighlight(),null);
 await plus.highlight({rect:()=>rect});assert.equal(plus.getHighlight().element.getBoundingClientRect().width,60);
 const buttons=document.querySelectorAll('button');buttons[0].focus();await plus.focus({element:buttons[1]},{restore:true});assert.equal(document.activeElement,buttons[1]);await plus.clearHighlight();assert.equal(document.activeElement,buttons[0]);release();await plus.dispose();
});
test('overlay respects non-dismissible and disabled-keyboard tour settings',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));const release=mountOverlay(plus);await plus.whenReady();
 await plus.startTour([{target:{element:document.querySelector('button')},message:'One'},{target:{rect:()=>rect},message:'Two'}],{dismissible:false,keyboard:false});await frame();
 window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape'}));window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight'}));assert.equal(plus.getTour().index,0);
 document.querySelectorAll('.rp-overlay-button')[1].click();await frame();assert.equal(plus.getTour().index,1);release();await plus.dispose();assert.equal(document.querySelector('.rp-overlay-root'),null);
});

test('unmount during initial plugin setup cannot leave a late DOM runtime installed',async()=>{
 let release;const gate=new Promise(r=>release=r);const plus=createRouterPlus({pages,globalKey:false,plugins:[{id:'initial',setup:()=>gate}]});
 const detach=installDomRuntime(plus);detach();release();await plus.whenReady();await assert.rejects(plus.unuse('router-plus:dom-runtime'));await plus.dispose();
});

test('overlay presentation belongs to App theme and updates without replacing the renderer',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));
 const handle=mountOverlay(plus,{root:document,className:'app-guide',theme:{zIndex:40,maskColor:'#123456',highlightRadius:0,highlightBorderColor:'red',highlightBorderWidth:0,highlightPadding:'var(--app-gap, 9px)'}});
 await plus.whenReady();await plus.highlight({rect:()=>rect},{spotlight:true,className:'one'});await frame();
 const root=document.querySelector('.rp-overlay-root'),spot=document.querySelector('.rp-overlay-highlight');
 assert.equal(root.style.zIndex,'');assert.equal(root.style.getPropertyValue('--rp-z-index'),'40');
 assert.equal(root.style.getPropertyValue('--rp-mask'),'#123456');assert.equal(root.style.getPropertyValue('--rp-highlight-radius'),'0px');assert.equal(root.style.getPropertyValue('--rp-highlight-border-width'),'0px');
 assert.equal(root.style.getPropertyValue('--rp-highlight-padding'),'var(--app-gap, 9px)');assert.equal(root.style.getPropertyValue('--rp-target-left'),'10px');assert.equal(root.style.getPropertyValue('--rp-target-width'),'60px');assert.equal(spot.style.left,'');assert.equal(spot.style.width,'');
 assert.equal(root.classList.contains('app-guide'),true);assert.equal(root.classList.contains('one'),true);
 const highlight=plus.getHighlight();handle.update({className:'new-app-guide',theme:{zIndex:'var(--app-layer)',highlightPadding:0}});
 assert.equal(document.querySelector('.rp-overlay-root'),root);assert.equal(plus.getHighlight(),highlight);assert.equal(root.style.getPropertyValue('--rp-z-index'),'var(--app-layer)');assert.equal(root.style.getPropertyValue('--rp-highlight-padding'),'0px');assert.equal(root.style.getPropertyValue('--rp-mask'),'');assert.equal(root.classList.contains('app-guide'),false);assert.equal(root.classList.contains('new-app-guide'),true);
 await plus.highlight({rect:()=>rect},{spotlight:true,padding:0,className:'two'});await frame();assert.equal(spot.style.getPropertyValue('--rp-command-padding'),'0px');assert.equal(root.classList.contains('one'),false);assert.equal(root.classList.contains('new-app-guide'),true);
 await plus.highlight({rect:()=>rect},{spotlight:true});await frame();assert.equal(spot.style.getPropertyValue('--rp-command-padding'),'');assert.equal(root.style.getPropertyValue('--rp-highlight-padding'),'0px');
 handle();await plus.dispose();
});

test('App CSS defaults survive inheritance and mounting can avoid style injection',async()=>{
 const {overlayStyles}=await import('../dist/esm/dom/index.js');
 assert.match(overlayStyles,/:where\(\.rp-overlay-root\)/);assert.match(overlayStyles,/z-index: var\(--rp-z-index, clamp\(var\(--rp-z-index-min, -2147483648\), 10000, var\(--rp-z-index-max, 2147483647\)\)\)/);assert.doesNotMatch(overlayStyles,/--rp-mask:\s|--rp-radius:\s|2147483000|outline:\s*(none|0)/);assert.match(overlayStyles,/width: max-content/);
 const plus=createRouterPlus({pages,globalKey:false});const handle=mountOverlay(plus,{injectStyles:false,installRuntime:false});
 assert.equal(document.querySelector('style[data-router-plus="overlay-styles"]'),null);const root=document.querySelector('.rp-overlay-root');
 assert.equal(root.style.getPropertyValue('--rp-mask'),'');assert.equal(root.style.getPropertyValue('--rp-radius'),'');assert.equal(root.style.getPropertyValue('--rp-z-index'),'');
 handle();handle();assert.equal(document.querySelector('.rp-overlay-root'),null);await plus.dispose();
});

test('App CSS variables declared before mounting are not replaced by injected defaults',async()=>{
 const style=document.createElement('style');style.textContent='.app-css-guide { --rp-z-index: 37; --rp-mask: rgba(1, 2, 3, 0.2); --rp-highlight-padding: 0px; }';document.head.append(style);
 const plus=createRouterPlus({pages,globalKey:false});const handle=mountOverlay(plus,{className:'app-css-guide',installRuntime:false});
 const root=document.querySelector('.rp-overlay-root'),computed=window.getComputedStyle(root);
 assert.equal(computed.getPropertyValue('--rp-z-index').trim(),'37');assert.equal(computed.getPropertyValue('--rp-mask').trim(),'rgba(1, 2, 3, 0.2)');assert.equal(computed.getPropertyValue('--rp-highlight-padding').trim(),'0px');handle();style.remove();await plus.dispose();
});

test('inactive guides and App-handled keyboard events do not consume higher-level interactions',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const handle=mountOverlay(plus);await plus.whenReady();
 const idle=new window.KeyboardEvent('keydown',{key:'Escape',cancelable:true});window.dispatchEvent(idle);assert.equal(idle.defaultPrevented,false);
 await plus.highlight({rect:()=>rect},{spotlight:true});const active=plus.getHighlight();
 const handled=new window.KeyboardEvent('keydown',{key:'Escape',cancelable:true});handled.preventDefault();window.dispatchEvent(handled);assert.equal(plus.getHighlight(),active);
 const escape=new window.KeyboardEvent('keydown',{key:'Escape',cancelable:true});window.dispatchEvent(escape);assert.equal(plus.getHighlight(),null);handle();await plus.dispose();
});


test('overlay z-index supports high default, bounded ranges and exact values',async()=>{
 const {DEFAULT_OVERLAY_Z_INDEX,overlayStyles}=await import('../dist/esm/dom/index.js');assert.equal(DEFAULT_OVERLAY_Z_INDEX,10000);assert.match(overlayStyles,/10000/);
 const plus=createRouterPlus({pages,globalKey:false});const handle=mountOverlay(plus,{installRuntime:false,theme:{zIndex:{max:59}}});const root=document.querySelector('.rp-overlay-root');
 assert.equal(root.style.getPropertyValue('--rp-z-index'),'');assert.equal(root.style.getPropertyValue('--rp-z-index-max'),'59');assert.equal(root.style.getPropertyValue('--rp-z-index-min'),'');
 handle.update({theme:{zIndex:{min:12000}}});assert.equal(root.style.getPropertyValue('--rp-z-index-min'),'12000');assert.equal(root.style.getPropertyValue('--rp-z-index-max'),'');
 handle.update({theme:{zIndex:{min:0,max:0}}});assert.equal(root.style.getPropertyValue('--rp-z-index-min'),'0');assert.equal(root.style.getPropertyValue('--rp-z-index-max'),'0');
 assert.throws(()=>handle.update({theme:{zIndex:{min:60,max:59}}}),/min must not exceed max/);assert.equal(root.style.getPropertyValue('--rp-z-index-max'),'0');
 assert.throws(()=>handle.update({theme:{zIndex:Infinity}}),/safe integer/);
 handle.update({theme:{zIndex:80}});assert.equal(root.style.getPropertyValue('--rp-z-index'),'80');assert.equal(root.style.getPropertyValue('--rp-z-index-min'),'');assert.equal(root.style.getPropertyValue('--rp-z-index-max'),'');
 handle.update({});assert.equal(root.style.getPropertyValue('--rp-z-index'),'');handle();await plus.dispose();
 assert.throws(()=>mountOverlay(plus,{theme:{zIndex:{min:2,max:1}}}),/min must not exceed max/);assert.equal(document.querySelector('.rp-overlay-root'),null);
});

test('registered highlight content shares geometry and layer without default decoration',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));let host,mounted=0,destroyed=0;const states=[];
 const renderer={mount(root){host=root;mounted++;const mark=document.createElement('i');mark.className='app-highlight';mark.style.borderRadius='3px';mark.style.border='5px solid green';root.append(mark);},render(state){states.push(state);},destroy(){destroyed++;}};
 const theme={zIndex:{max:59},highlightRadius:99,highlightBorderWidth:8,maskRadius:3};const handle=mountOverlay(plus,{theme,highlightRenderer:renderer});await plus.whenReady();
 const nativeTip=document.querySelector('.rp-overlay-tip');nativeTip.getBoundingClientRect=()=>{throw Error('Custom bubbles belong to App');};await plus.highlight({rect:()=>rect},{spotlight:true,padding:2,message:'App'});await frame();const root=document.querySelector('.rp-overlay-root'),box=document.querySelector('.rp-overlay-highlight');
 assert.equal(host.parentElement,box);assert.equal(host.className,'rp-overlay-highlight-content');assert.equal(root.style.getPropertyValue('--rp-z-index-max'),'59');assert.equal(root.style.getPropertyValue('--rp-target-width'),'60px');assert.equal(box.style.getPropertyValue('--rp-command-padding'),'2px');assert.equal(root.dataset.customHighlight,'true');assert.equal(document.querySelector('.rp-overlay-spotlight').hidden,true);assert.equal(document.querySelector('.app-highlight').style.borderRadius,'3px');assert.equal(states.at(-1).context.highlight.message,'App');assert.equal(nativeTip.hidden,true);assert.equal(states.at(-1).context.overlayRoot,root);
 handle.update({theme,highlightRenderer:renderer});assert.equal(mounted,1);assert.equal(document.querySelector('.rp-overlay-root'),root);
 await plus.clearHighlight();await frame();assert.equal(states.at(-1),null);assert.equal(root.hidden,true);
 await plus.highlight({rect:()=>rect},{spotlight:true});await frame();delete nativeTip.getBoundingClientRect;handle.update({theme});assert.equal(destroyed,1);assert.equal(document.querySelector('.rp-overlay-highlight-content'),null);assert.equal(document.querySelector('.rp-overlay-spotlight').hidden,false);assert.equal(root.dataset.customHighlight,'false');handle();await plus.dispose();
});

test('failed highlight component mounting leaves no overlay or content host behind',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let destroyed=0;
 assert.throws(()=>mountOverlay(plus,{highlightRenderer:{mount(){throw Error('App mount');},render(){},destroy(){destroyed++;}}}),/App mount/);
 assert.equal(destroyed,1);assert.equal(document.querySelector('.rp-overlay-root'),null);assert.equal(document.querySelector('style[data-router-plus="overlay-styles"]'),null);await plus.dispose();
});

test('bubble corners, viewport-aware directions and none use the shared placement catalog',async()=>{
 const {tipPlacements,chooseTipSide,tipViewportShift,chooseFixedTipSide}=await import('../dist/esm/dom/placement.js');const viewport={left:0,top:0,width:400,height:300};
 assert.equal(Object.keys(tipPlacements).length,18);assert.deepEqual(tipPlacements['top-left'],{side:'top',align:'start',viewport:false});assert.deepEqual(tipPlacements['left-top'],{side:'left',align:'start',viewport:false});
 const edgeTarget={left:10,right:310,top:10,bottom:30,width:300,height:20};const edgeBubble={left:0,top:0,right:120,bottom:50,width:120,height:50};
 assert.equal(chooseFixedTipSide('left',edgeTarget,edgeBubble,viewport,12),'right');
 assert.equal(chooseFixedTipSide('top',edgeTarget,edgeBubble,viewport,12),'bottom');
 assert.equal(chooseFixedTipSide('bottom',edgeTarget,edgeBubble,viewport,12),'bottom');
 const target={left:150,right:190,top:240,bottom:260,width:40,height:20};const bubble={left:100,top:272,right:220,bottom:322,width:120,height:50};assert.equal(chooseTipSide('bottom-auto',target,bubble,viewport,12),'top');
 assert.deepEqual(tipViewportShift({left:-10,top:270,right:110,bottom:320,width:120,height:50},viewport),{x:26,y:-36});
 assert.deepEqual(tipViewportShift({left:15,top:10,right:135,bottom:60,width:120,height:50},{left:20,top:30,width:300,height:200}),{x:21,y:36});
 const plus=createRouterPlus({pages,globalKey:false});const handle=mountOverlay(plus);await plus.whenReady();
 for(const [placement,definition] of Object.entries(tipPlacements)){
  await plus.highlight({rect:()=>rect},{spotlight:true,placement});await frame();const tip=document.querySelector('.rp-overlay-tip');assert.equal(tip.hidden,placement==='none',placement);if(placement!=='none'){assert.equal(tip.dataset.placement,placement);assert.equal(tip.dataset.align,definition.align);if(!definition.viewport)assert.equal(tip.dataset.side,definition.side);}
 }
 await plus.startTour([{target:{rect:()=>rect},message:'Hidden',placement:'none'}]);await frame();assert.equal(document.querySelector('.rp-overlay-tip').hidden,true);assert.ok(plus.getHighlight());handle();await plus.dispose();
});

test('default component uses the shared props and keeps exactly two tour buttons inside its bubble',async()=>{
 const {createDefaultHighlightRenderer}=await import('../dist/esm/dom/index.js');const plus=createRouterPlus({pages,globalKey:false});await plus.startTour([{target:{rect:()=>rect},message:'One'},{target:{rect:()=>rect},message:'Two'}]);
 const host=document.createElement('div');document.body.append(host);const component=createDefaultHighlightRenderer();component.mount(host);const moves=[];
 const context={overlayRoot:host,targetRect:rect,highlight:plus.getHighlight(),page:plus.getContext(),tour:plus.getTour(),next:async(step=1)=>{moves.push(step);return{ok:true};}};
 component.render({width:72,height:32,left:4,top:4,context,styles:{radius:4,tipBorderWidth:1,tipBorderColor:'green'}});
 let buttons=component.bubble.querySelectorAll('button');assert.equal(buttons.length,2);assert.deepEqual([...buttons].map(x=>x.textContent),['上一步','下一步']);assert.equal(buttons[0].disabled,true);buttons[0].click();buttons[1].click();assert.deepEqual(moves,[1]);assert.equal(host.style.getPropertyValue('--rp-radius'),'4px');
 component.render({width:72,height:32,left:4,top:4,context:{...context,tour:{...context.tour,index:1}}});buttons=component.bubble.querySelectorAll('button');assert.equal(buttons.length,2);assert.equal(buttons[0].disabled,false);buttons[0].click();buttons[1].click();assert.deepEqual(moves,[1,-1,1]);component.destroy();host.remove();await plus.dispose();
});

test('custom components advance tours through context.next without any default bubble rules',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});let props;const handle=mountOverlay(plus,{highlightRenderer:{mount(){},render(value){if(value)props=value;},destroy(){}}});await plus.whenReady();
 await plus.startTour(Array.from({length:4},(_,i)=>({target:{rect:()=>rect},message:String(i)})));await frame();const next=props.context.next;
 assert.equal(document.querySelector('.rp-overlay-tip').hidden,true);await next(2);assert.equal(plus.getTour().index,2);await next(-1);assert.equal(plus.getTour().index,1);await frame();
 handle();assert.equal((await next()).reason,'cancelled');assert.equal(plus.getTour().index,1);await plus.dispose();
});

test('ordinary highlight uses an accessible corner close control without a footer row',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});const handle=mountOverlay(plus);await plus.whenReady();await plus.highlight({rect:()=>rect},{message:'Content',spotlight:true});await frame();
 const tip=document.querySelector('.rp-overlay-tip'),close=tip.querySelector('.rp-overlay-close');assert.equal(close.textContent,'×');assert.equal(close.getAttribute('aria-label'),'关闭');assert.equal(tip.querySelector('.rp-overlay-actions').hidden,true);assert.equal(tip.dataset.close,'true');assert.equal(close.hidden,false);
 close.click();await frame();assert.equal(plus.getHighlight(),null);
 await plus.highlight({rect:()=>rect},{message:'Locked',dismissible:false});await frame();assert.equal(close.hidden,true);assert.equal(tip.dataset.close,'false');handle();await plus.dispose();
});

test('DOM runtime cleanup owns exactly one reference across duplicate and stale releases',async()=>{
 const plus=createRouterPlus({pages,globalKey:false});plus.connect(createMemoryConnection({initial:{pathname:'/a'}}));
 const first=installDomRuntime(plus),second=installDomRuntime(plus);await plus.whenReady();first();first();await plus.whenReady();assert.equal((await plus.highlight('same')).ok,true);
 second();await plus.whenReady();const third=installDomRuntime(plus);await plus.whenReady();first();second();await plus.whenReady();assert.equal((await plus.highlight('same')).ok,true);third();await plus.whenReady();await plus.dispose();
});
