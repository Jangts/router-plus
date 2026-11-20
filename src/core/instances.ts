/**
 * Page instance identity and the retained-instance set.
 *
 * Instance keys are encoded into stable state and history keys so page ids and keys cannot
 * collide when either contains separator characters.
 */
import type {
  InstanceKeyStrategy,
  PageCatalogEntry,
  PageContext,
  PageDefinition,
  PageInstance,
} from './types.js';

export function encodeInstancePart(value: string): string {
  return encodeURIComponent(value);
}

export function computeInstanceKey(
  strategy: InstanceKeyStrategy | undefined,
  context: PageContext,
  custom?: ReadonlyMap<string, InstanceKeyStrategy>,
): string {
  let resolved = strategy;
  if (typeof resolved === 'string' && custom?.has(resolved)) resolved = custom.get(resolved);
  switch (resolved) {
    case undefined:
    case 'pathname':
      return context.pathname;
    case 'page':
      return context.pageId ?? context.pathname;
    default:
      break;
  }
  if (typeof resolved === 'function') {
    const value = resolved(context);
    return typeof value === 'string' && value ? value : context.pathname;
  }
  if (resolved && typeof resolved === 'object' && Array.isArray(resolved.params)) {
    const values = resolved.params.map((key) => context.params[key]);
    return values.every(Boolean) ? values.join('\u0000') : context.pathname;
  }
  return context.pathname;
}

export function createInstance(
  page: PageCatalogEntry,
  instanceKey: string,
  tab: string | null,
  retained = false,
): PageInstance {
  const encodedPage = encodeInstancePart(page.id);
  const encodedKey = encodeInstancePart(instanceKey);
  return {
    pageId: page.id,
    instanceKey,
    tab,
    stateKey: `${encodedPage}::${encodedKey}`,
    historyKey: `${encodedPage}#${encodedKey}`,
    retained,
  };
}

interface RetainedEntry {
  readonly instance: PageInstance;
  lastAccess: number;
}

/** Retained instances per page, with an optional per-page cap and LRU eviction. */
export class RetentionManager {
  private readonly retained = new Map<string, Map<string, RetainedEntry>>();
  private clock = 0;

  add(instance: PageInstance): void {
    const page = this.retained.get(instance.pageId) ?? new Map<string, RetainedEntry>();
    page.set(instance.instanceKey, { instance, lastAccess: ++this.clock });
    this.retained.set(instance.pageId, page);
  }

  touch(instance: PageInstance): void {
    const entry = this.retained.get(instance.pageId)?.get(instance.instanceKey);
    if (entry) entry.lastAccess = ++this.clock;
  }

  remove(instance: PageInstance): boolean {
    const page = this.retained.get(instance.pageId);
    if (!page) return false;
    const removed = page.delete(instance.instanceKey);
    if (page.size === 0) this.retained.delete(instance.pageId);
    return removed;
  }

  list(pageId?: string): readonly PageInstance[] {
    if (pageId)
      return [...(this.retained.get(pageId)?.values() ?? [])].map((entry) => entry.instance);
    return [...this.retained.values()].flatMap((page) =>
      [...page.values()].map((entry) => entry.instance),
    );
  }

  /** Return instances to release according to `retain` and the current active instance. */
  decide(definition: PageDefinition, entering: PageInstance): readonly PageInstance[] {
    if (!definition.retain) return [];
    const max = typeof definition.retain === 'object' ? definition.retain.max : undefined;
    if (max === undefined) return [];
    const limit = Math.max(1, Math.floor(max));
    const page = this.retained.get(entering.pageId);
    if (!page) return [];
    const candidates = [...page.values()]
      .filter((entry) => entry.instance.instanceKey !== entering.instanceKey)
      .sort((left, right) => left.lastAccess - right.lastAccess);
    const overflow = page.size + (page.has(entering.instanceKey) ? 0 : 1) - limit;
    return overflow > 0 ? candidates.slice(0, overflow).map((entry) => entry.instance) : [];
  }

  clear(): void {
    this.retained.clear();
  }
}
