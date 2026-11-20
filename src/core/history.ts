/**
 * History state namespace and tab restoration.
 *
 * The namespace is versioned and configurable. The caller's own state is merged into the same
 * object without being replaced; non-object state is preserved inside the namespace instead of
 * being silently dropped.
 */
import type { PageDefinition } from './types.js';
import { isPlainObject, parseSearch } from './util.js';

export const HISTORY_STATE_VERSION = 1;

export interface HistoryRecord {
  readonly version: number;
  readonly pageId: string | null;
  readonly path: string;
  readonly instanceKey: string;
  readonly stateKey: string;
  readonly historyKey: string;
  readonly tab: string | null;
  readonly values?: Readonly<Record<string, unknown>>;
}

interface StoredRecord extends HistoryRecord {
  readonly rawState?: unknown;
}

/** Merge the plus record into the caller's state without discarding non-object values. */
export function writeHistoryState(
  existing: unknown,
  record: HistoryRecord,
  key: string,
): Record<string, unknown> {
  const base = isPlainObject(existing) ? { ...existing } : {};
  base[key] = {
    ...record,
    ...(!isPlainObject(existing) && existing !== undefined ? { rawState: existing } : {}),
  } satisfies StoredRecord;
  return base;
}

export function readHistoryState(state: unknown, key: string): HistoryRecord | null {
  if (!isPlainObject(state)) return null;
  const value = state[key];
  if (!isPlainObject(value)) return null;
  if (value.version !== HISTORY_STATE_VERSION) return null;
  if (typeof value.path !== 'string' || typeof value.instanceKey !== 'string') return null;
  return {
    version: value.version,
    pageId: typeof value.pageId === 'string' ? value.pageId : null,
    path: value.path,
    instanceKey: value.instanceKey,
    stateKey: typeof value.stateKey === 'string' ? value.stateKey : '',
    historyKey: typeof value.historyKey === 'string' ? value.historyKey : '',
    tab: typeof value.tab === 'string' ? value.tab : null,
    values: isPlainObject(value.values) ? value.values : undefined,
  };
}
