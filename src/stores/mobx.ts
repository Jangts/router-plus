/** MobX store-slice bridge. */
import type { PageStateBridge } from '../core/types.js';
import { createStoreBridge, type StoreBridgeOptions } from './common.js';

export function createMobxPageStateBridge<Store, S>(
  options: StoreBridgeOptions<Store, S>,
): PageStateBridge<S> {
  return createStoreBridge(options);
}

export type { StoreBridgeOptions };
