/**
 * Optional React route-record generator.
 *
 * Hand-written route trees remain a first-class path; this helper only maps page definitions to
 * plain route records and never owns application shells.
 */
import {
  createElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { PageDefinition, RouterPlus } from '../core/types.js';
import { createCatalogRuntime } from '../core/catalog.js';

export type RouteComponent =
  ComponentType<Record<string, never>> | ComponentType<{ readonly children?: ReactNode }>;

export interface ReactRouteRecord {
  readonly path: string;
  readonly name: string;
  readonly id?: string;
  readonly handle?: Readonly<Record<string, unknown>>;
  readonly element?: ReactElement;
  readonly children?: readonly ReactRouteRecord[];
  readonly meta: Readonly<Record<string, unknown>>;
}

export interface CreateReactRoutesOptions {
  readonly components?: Readonly<Record<string, RouteComponent | ReactElement>>;
  readonly layouts?: Readonly<Record<string, ComponentType<{ readonly children?: ReactNode }>>>;
  readonly plus?: RouterPlus;
  readonly wrap?: (element: ReactElement, page: PageDefinition) => ReactElement;
}

function idOf(page: PageDefinition): string {
  return page.id ?? page.path;
}

function renderComponent(
  value: RouteComponent | ReactElement | undefined,
): ReactElement | undefined {
  if (!value) return undefined;
  if (isValidElement(value)) return value;
  return createElement(value as ComponentType<Record<string, never>>);
}

/** Build route records from page definitions, nesting by `parentId`. */
export function createReactRoutes(
  pages: readonly PageDefinition[],
  options: CreateReactRoutesOptions = {},
): readonly ReactRouteRecord[] {
  createCatalogRuntime(pages);
  const records = new Map<string, { record: ReactRouteRecord; children: ReactRouteRecord[] }>();
  for (const page of pages) {
    const id = idOf(page);
    const key = page.component ?? id;
    let element =
      renderComponent(options.components?.[key]) ??
      renderComponent(options.components?.[page.path]);
    const layout = page.layout ? options.layouts?.[page.layout] : undefined;
    if (layout && element) element = createElement(layout, null, element);
    if (element && options.wrap) element = options.wrap(element, page);
    records.set(id, {
      record: {
        path: page.path,
        children: [],
        name: id,
        id,
        handle: { pageId: id },
        element,
        meta: {
          title: page.title,
          pageId: id,
          retain: Boolean(page.retain),
          instanceKey:
            typeof page.instanceKey === 'function' ? 'custom' : (page.instanceKey ?? 'pathname'),
        },
      },
      children: [],
    });
  }
  const roots: ReactRouteRecord[] = [];
  for (const page of pages) {
    const id = idOf(page);
    const entry = records.get(id);
    if (!entry) continue;
    if (page.parentId && records.has(page.parentId)) {
      (records.get(page.parentId)!.record.children as ReactRouteRecord[]).push(entry.record);
    } else {
      roots.push(entry.record);
    }
  }
  const definitions = new Map(pages.map((page) => [idOf(page), page]));
  const cloneAlias = (
    record: ReactRouteRecord,
    prefix: string,
    alias: string,
    suffix: string,
  ): ReactRouteRecord => ({
    ...record,
    id: `${record.id}${suffix}`,
    path: record.path.startsWith(prefix) ? alias + record.path.slice(prefix.length) : record.path,
    children: record.children?.map((child) => cloneAlias(child, prefix, alias, suffix)),
  });
  const expand = (record: ReactRouteRecord): ReactRouteRecord[] => {
    const complete = { ...record, children: record.children?.flatMap(expand) };
    return [
      complete,
      ...(definitions.get(record.name)?.pathAliases ?? []).map((alias, index) =>
        cloneAlias(complete, record.path, alias, `:alias:${index}`),
      ),
    ];
  };
  const expanded = roots.flatMap(expand);
  return options.plus ? options.plus.transformRoutes(expanded, 'react') : expanded;
}
