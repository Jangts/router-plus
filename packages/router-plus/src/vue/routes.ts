/**
 * Optional Vue route-record generator.
 */
import { defineComponent, h, type Component } from 'vue';
import type { PageDefinition, RouterPlus } from '../core/types.js';
import { createCatalogRuntime } from '../core/catalog.js';

export interface VueRouteRecord {
  readonly path: string;
  readonly name: string;
  readonly alias?: readonly string[];
  readonly component?: Component;
  readonly children?: readonly VueRouteRecord[];
  readonly meta: Readonly<Record<string, unknown>>;
}

export interface CreateVueRoutesOptions {
  readonly components?: Readonly<Record<string, Component>>;
  readonly layouts?: Readonly<Record<string, Component>>;
  readonly plus?: RouterPlus;
  readonly wrap?: (component: Component, page: PageDefinition) => Component;
}

function idOf(page: PageDefinition): string {
  return page.id ?? page.path;
}

/** Build Vue route records from page definitions, nesting by `parentId`. */
export function createVueRoutes(
  pages: readonly PageDefinition[],
  options: CreateVueRoutesOptions = {},
): readonly VueRouteRecord[] {
  createCatalogRuntime(pages);
  const records = new Map<string, { record: VueRouteRecord; children: VueRouteRecord[] }>();
  for (const page of pages) {
    const id = idOf(page);
    const key = page.component ?? id;
    let component = options.components?.[key] ?? options.components?.[page.path];
    const layout = page.layout ? options.layouts?.[page.layout] : undefined;
    if (layout && component) {
      const inner = component;
      component = defineComponent({
        name: `RouterPlusLayout:${id}`,
        setup() {
          return () => h(layout, null, { default: () => h(inner) });
        },
      });
    }
    if (component && options.wrap) component = options.wrap(component, page);
    records.set(id, {
      record: {
        path: page.path,
        children: [],
        name: id,
        alias: page.pathAliases,
        component,
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
  const roots: VueRouteRecord[] = [];
  for (const page of pages) {
    const entry = records.get(idOf(page));
    if (!entry) continue;
    if (page.parentId && records.has(page.parentId)) {
      (records.get(page.parentId)!.record.children as VueRouteRecord[]).push(entry.record);
    } else {
      roots.push(entry.record);
    }
  }
  return options.plus ? options.plus.transformRoutes(roots, 'vue') : roots;
}
