/**
 * Browser console facade and ownership-safe global attachment.
 * Installation APIs stay on the instance; collisions reject before replacing any reference.
 */
import type { RouterPlus, RouterPlusGlobal } from './types.js';

export const DEFAULT_GLOBAL_KEY = '__ROUTER_PLUS__';
interface Attachment {
  readonly owner: RouterPlus;
  readonly facade: RouterPlusGlobal;
}
const attached = new Map<string, Attachment>();

export function toGlobalFacade(plus: RouterPlus): RouterPlusGlobal {
  return {
    execute: ((
      command: import('./types.js').RouterCommand | readonly import('./types.js').RouterCommand[],
      options?: import('./types.js').CommandSequenceOptions,
    ) =>
      Array.isArray(command)
        ? plus.execute(command, options)
        : plus.execute(command as import('./types.js').RouterCommand)) as RouterPlus['execute'],
    navigate: (target, options) => plus.navigate(target, options),
    patchQuery: (patch, options) => plus.patchQuery(patch, options),
    getContext: () => plus.getContext(),
    getState: <T = unknown>(key?: string) => plus.getState<T>(key),
    setState: (value, key) => plus.setState(value, key),
    patchState: (value, key) => plus.patchState(value, key),
    resetState: (key) => plus.resetState(key),
    listStateKeys: () => plus.listStateKeys(),
    callState: (id, ...args) => plus.callState(id, ...args),
    getTab: () => plus.getTab(),
    setTab: (tab) => plus.setTab(tab),
    highlight: (target, options) => plus.highlight(target, options),
    clearHighlight: () => plus.clearHighlight(),
    getHighlight: () => plus.getHighlight(),
    startTour: (steps, options) => plus.startTour(steps, options),
    nextTourStep: (step) => plus.nextTourStep(step),
    prevTourStep: () => plus.prevTourStep(),
    stopTour: () => plus.stopTour(),
    getTour: () => plus.getTour(),
    focus: (target, options) => plus.focus(target, options),
    scrollTo: (target, options) => plus.scrollTo(target, options),
    listTargets: () => plus.listTargets(),
    subscribe: (listener) => plus.subscribe(listener),
    pages: plus.pages,
    version: plus.version,
    apiVersion: plus.apiVersion,
  };
}

/** Reject occupied keys, including inherited and explicitly undefined properties. */
export function attachGlobal(plus: RouterPlus, key: string = DEFAULT_GLOBAL_KEY): () => void {
  const scope = globalThis as unknown as Record<string, unknown>;
  if (key in scope || attached.has(key))
    throw new Error(
      `Router Plus global key already occupied: ${key}. ` +
        'Create one instance per application. For hot replacement, pass hmr: import.meta.hot ' +
        '(Vite), import.meta.webpackHot (Webpack/Rspack), or module.hot (Webpack/Rspack/Parcel) ' +
        'in the instance-owning module. See docs/frameworks.md#hot-module-replacement. ' +
        'Do not overwrite another owner; use separate globalKey values for independent applications.',
    );
  const record: Attachment = { owner: plus, facade: toGlobalFacade(plus) };
  scope[key] = record.facade;
  attached.set(key, record);
  return () => {
    if (attached.get(key) === record) detachGlobal(key);
  };
}

/** Remove only the exact facade we installed; foreign replacements survive cleanup. */
export function detachGlobal(key: string = DEFAULT_GLOBAL_KEY): void {
  const record = attached.get(key);
  if (!record) return;
  attached.delete(key);
  const scope = globalThis as unknown as Record<string, unknown>;
  if (scope[key] === record.facade) delete scope[key];
}
