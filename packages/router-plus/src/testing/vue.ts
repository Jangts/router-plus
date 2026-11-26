/** Vue Test Utils fixture. Configure the runner's DOM environment before importing. */
import { mount, type MountingOptions } from '@vue/test-utils';
import { nextTick, type App, type Component } from 'vue';
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
import { createVueRouterPlus } from '../vue/plugin.js';
import type { RouterPlusTestOptions } from './fixture.js';
import { createCleanup } from './lifecycle.js';
export type MountRouterPlusOptions = RouterPlusTestOptions & {
  routes: RouteRecordRaw[];
  mountOptions?: MountingOptions<any>;
};
export async function mountRouterPlus(
  component: Component,
  options: MountRouterPlusOptions,
) {
  const { initial = '/', routes, mountOptions, ...core } = options;
  const cleanup = createCleanup();
  try {
    const router = createRouter({ history: createMemoryHistory(), routes });
    await router.push(initial);
    await router.isReady();
    const plus = createVueRouterPlus({ globalKey: false, ...core, router });
    cleanup.add(() => plus.dispose());
    let app: App | undefined;
    cleanup.add(() => app?.unmount());
    const wrapper = mount(component, {
      ...mountOptions,
      global: {
        ...mountOptions?.global,
        plugins: [
          {
            install(value: App) {
              app = value;
            },
          },
          ...(mountOptions?.global?.plugins ?? []),
          plus,
        ],
      },
    });
    cleanup.add(() => {
      wrapper.unmount();
      app = undefined;
    });
    await nextTick();
    await plus.whenReady();
    await nextTick();
    return { wrapper, plus, router, dispose: () => cleanup.dispose() };
  } catch (error) {
    return cleanup.fail(error);
  }
}
