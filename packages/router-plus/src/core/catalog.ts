/**
 * Page catalog: the fixed, read-only projection of caller-provided definitions plus the full
 * definitions kept internally for guards, state and generators.
 */
import { assertStateRules, stateFields, validState, queryKeys } from './state-fields.js';
import { defaultMatcher, matchDefinition, pageIdOf, type RouteMatcher } from './matcher.js';
import type {
  PageCatalog,
  PageCatalogEntry,
  PageDefinition,
  PageMatch,
  StateField,
} from './types.js';
import { normalizePathname, parseSearch, queryRecord } from './util.js';

export interface CatalogRuntime {
  readonly catalog: PageCatalog;
  setMatcher(matcher: RouteMatcher): void;
  readonly definitions: readonly PageDefinition[];
  readonly byId: ReadonlyMap<string, PageDefinition>;
  /** Original page contracts, independent of later instance registrations. */
  readonly declaredStates: ReadonlyMap<string, Readonly<Record<string, StateField>>>;
  match(pathname: string): {
    entry: PageCatalogEntry;
    definition: PageDefinition;
    params: Readonly<Record<string, string>>;
  } | null;
}

function project(definition: PageDefinition): PageCatalogEntry {
  return {
    id: pageIdOf(definition),
    path: definition.path,
    pathAliases: definition.pathAliases,
    title: definition.title,
    get states() {
      return Object.freeze({ ...definition.states });
    },
    tabs: definition.tabs,
    defaultTab: definition.defaultTab,
    tabInUrl: definition.tabInUrl,
    retain:
      definition.retain === true ||
      (typeof definition.retain === 'object' && definition.retain !== null),
    instanceKey:
      typeof definition.instanceKey === 'function'
        ? 'custom'
        : (definition.instanceKey ?? 'pathname'),
    parentId: definition.parentId,
  };
}

/**
 * Build a fixed catalog. Definitions are copied into an internal list and projected into
 * entries that never expose `meta`, guards, state factories or component implementations.
 */
export function createCatalogRuntime(
  definitions: readonly PageDefinition[],
  matcher: RouteMatcher = defaultMatcher,
  tabKey = 'tab',
): CatalogRuntime {
  definitions = Object.freeze(
    definitions.map((definition) =>
      Object.freeze({
        ...definition,
        states: Object.fromEntries(
          Object.entries(stateFields(definition, tabKey)).map(([key, field]) => [
            key,
            Object.freeze({
              ...field,
              catalog: true,
              values: field.values ? Object.freeze([...field.values]) : undefined,
            }),
          ]),
        ),
        pathAliases: definition.pathAliases
          ? Object.freeze([...definition.pathAliases])
          : undefined,
        tabs: definition.tabs
          ? Object.freeze(definition.tabs.map((tab) => Object.freeze({ ...tab })))
          : undefined,
      }),
    ),
  );
  let activeMatcher = matcher;
  const seenIds = new Set<string>();
  for (const definition of definitions) {
    const id = pageIdOf(definition);
    if (!id) throw new Error('Page id is empty');
    if (seenIds.has(id)) throw new Error(`Duplicate page id: ${id}`);
    seenIds.add(id);
    if (!definition.path.startsWith('/') || definition.path.startsWith('//')) {
      throw new Error(`Page path must be a single absolute path: ${definition.path}`);
    }
    const queries = new Set<string>();
    for (const [key, field] of Object.entries(stateFields(definition))) {
      assertStateRules(field);
      if (!validState(field, field.default))
        throw new Error(`Invalid default state on ${id}: ${key}`);
      for (const query of queryKeys(key, field)) {
        if (queries.has(query)) throw new Error(`Duplicate state query on ${id}: ${query}`);
        queries.add(query);
      }
    }
    const tabIds = new Set<string>();
    for (const tab of definition.tabs ?? []) {
      if (!tab.id) throw new Error(`Empty tab id on page: ${id}`);
      if (tabIds.has(tab.id)) throw new Error(`Duplicate tab id on page ${id}: ${tab.id}`);
      tabIds.add(tab.id);
    }
    if (definition.defaultTab && !tabIds.has(definition.defaultTab))
      throw new Error(`Unknown default tab on ${id}`);
    if (typeof definition.retain === 'object' && definition.retain?.max !== undefined) {
      const max = definition.retain.max;
      if (!Number.isInteger(max) || max <= 0) {
        throw new Error(`retain.max must be a positive integer: ${id}`);
      }
    }
  }
  for (const definition of definitions) {
    const visited = new Set<string>();
    let cursor: PageDefinition | undefined = definition;
    while (cursor?.parentId) {
      if (visited.has(cursor.parentId)) throw new Error('Page parent cycle');
      visited.add(cursor.parentId);
      const parent: PageDefinition | undefined = definitions.find(
        (item) => pageIdOf(item) === cursor!.parentId,
      );
      if (!parent) throw new Error(`Unknown parent page: ${cursor.parentId}`);
      cursor = parent;
    }
  }
  const entries = Object.freeze(
    definitions.map((definition) => Object.freeze(project(definition))),
  );
  const byId = new Map(definitions.map((definition) => [pageIdOf(definition), definition]));
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));

  const match = (pathname: string) => {
    const normalized = normalizePathname(pathname);
    const selected = activeMatcher.matchPages?.(definitions, normalized);
    if (activeMatcher.matchPages && !selected) return null;
    const candidates = selected
      ? definitions.filter((item) => pageIdOf(item) === selected.pageId)
      : definitions;
    for (const definition of candidates) {
      const matched = selected
        ? { params: selected.params }
        : matchDefinition(definition, normalized, activeMatcher);
      if (selected && definition.params)
        for (const [key, validate] of Object.entries(definition.params)) {
          if (
            validate &&
            (selected.params[key] === undefined || validate(selected.params[key]) !== true)
          )
            return null;
        }
      if (!matched) continue;
      const id = pageIdOf(definition);
      const entry = entryById.get(id);
      if (!entry) continue;
      return { entry, definition, params: matched.params };
    }
    return null;
  };

  const catalog: PageCatalog = {
    entries,
    ids: entries.map((entry) => entry.id),
    get(id) {
      return entryById.get(id);
    },
    byPath(pathname) {
      const { pathname: onlyPath, search } = splitSearch(pathname);
      const matched = match(onlyPath);
      if (!matched) return null;
      const queryAll = parseSearch(search);
      return {
        page: matched.entry,
        params: matched.params,
        query: queryRecord(queryAll),
        queryAll,
        tab: null,
      } satisfies PageMatch;
    },
  };

  return {
    catalog,
    definitions,
    byId,
    declaredStates: new Map(
      definitions.map((definition) => [
        pageIdOf(definition),
        Object.freeze({ ...definition.states }),
      ]),
    ),
    match,
    setMatcher(value) {
      activeMatcher = value;
    },
  };
}

function splitSearch(value: string): { pathname: string; search: string } {
  const index = value.indexOf('?');
  if (index < 0) return { pathname: value, search: '' };
  return { pathname: value.slice(0, index), search: value.slice(index) };
}
