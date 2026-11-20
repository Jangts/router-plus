/**
 * In-memory lifecycle recorder for instance hosts.
 */
import type { InstanceHost } from '../core/types.js';

export interface MemoryHost extends InstanceHost {
  readonly calls: readonly string[];
  readonly mounted: boolean;
  readonly active: boolean;
  readonly disposed: boolean;
}

export function createMemoryHost(): MemoryHost {
  const calls: string[] = [];
  let mounted = false;
  let active = false;
  let disposed = false;
  return {
    get calls() {
      return calls;
    },
    get mounted() {
      return mounted;
    },
    get active() {
      return active;
    },
    get disposed() {
      return disposed;
    },
    mount() {
      calls.push('mount');
      mounted = true;
    },
    activate() {
      calls.push('activate');
      active = true;
    },
    deactivate() {
      calls.push('deactivate');
      active = false;
    },
    dispose() {
      calls.push('dispose');
      disposed = true;
    },
    ready() {
      return mounted && !disposed;
    },
    root() {
      return null;
    },
  };
}
