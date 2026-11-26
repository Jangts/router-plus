/**
 * Resolve a state hook's page selector without discarding a concrete instance address.
 * A page id denotes the current instance when it matches; other dynamic instances require a
 * concrete path because their parameters cannot be inferred from a definition alone.
 */
import type { PageContext, RouterPlus } from './types.js';

export function resolveStatePage(plus: RouterPlus, context: PageContext, selector?: string) {
  const byId = selector === undefined ? undefined : plus.pages.get(selector);
  const currentId = selector === undefined || byId?.id === context.pageId;
  const plan = currentId
    ? plus.resolveTarget(context.path)
    : plus.resolveTarget(byId ? { page: byId.id } : selector!);
  const entry =
    byId ??
    (plan?.kind === 'page' && plan.pageId ? plus.pages.get(plan.pageId) : undefined) ??
    (selector === undefined ? context.page : null);
  const path = plan?.kind === 'page' ? plan.href : null;
  const current = Boolean(
    entry && entry.id === context.pageId && plan?.kind === 'page' && plan.path === context.pathname,
  );
  return { entry, path, current };
}
