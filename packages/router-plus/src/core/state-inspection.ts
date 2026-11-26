/** Metadata projection shared by page and global registration indexes; never reads live values. */
import type { PageContext, PageStateBridge, StateField, StateInspection } from './types.js';
import { queryKeys } from './state-fields.js';

/** Project an installed source without invoking its getter, codecs, setter or command. */
export function describeSource(
  id: string,
  bridge: PageStateBridge,
  rules: StateField | undefined,
  context: PageContext | null,
): StateInspection {
  return Object.freeze({
    id,
    scope: context ? 'page' : 'global',
    pageId: context?.pageId ?? null,
    stateKey: context?.instance?.stateKey ?? null,
    parentId: rules?.sourceParentId ?? null,
    capabilities: Object.freeze({
      read: true as const,
      write: Boolean(bridge.write),
      call: Boolean(bridge.call),
    }),
    queryKeys: Object.freeze([...queryKeys(id, rules ?? {})]),
  });
}
