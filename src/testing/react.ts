/** React Testing Library fixture. The runner owns the DOM environment. */
import { render, act, type RenderOptions } from '@testing-library/react/pure.js';
import { createElement, type ReactElement } from 'react';
import { MemoryRouter, createMemoryRouter, type RouteObject } from 'react-router-dom';
import { createReactRouterPlus } from '../react/create.js';
import type { RouterPlusTestOptions } from './fixture.js';
import { createCleanup } from './lifecycle.js';
export type RenderRouterPlusOptions = RouterPlusTestOptions & {
  renderOptions?: Omit<RenderOptions, 'queries'>;
} & ({ routes: RouteObject[]; ui?: never } | { ui: ReactElement; routes?: never });
export async function renderRouterPlus(options: RenderRouterPlusOptions) {
  const { initial = '/', routes, ui, renderOptions, ...core } = options;
  const cleanup = createCleanup();
  try {
    const router = routes ? createMemoryRouter(routes, { initialEntries: [initial] }) : null;
    if (router) {
      cleanup.add(() => router.dispose());
      if (!router.state.initialized)
        await new Promise<void>((resolve) => {
          const stop = router.subscribe((state) => {
            if (state.initialized) {
              stop();
              resolve();
            }
          });
        });
    }
    const plus = createReactRouterPlus({
      globalKey: false,
      ...core,
      router: router ?? createElement(MemoryRouter, { initialEntries: [initial] }),
    });
    cleanup.add(() => plus.dispose());
    const container =
      renderOptions?.container ?? document.body.appendChild(document.createElement('div'));
    if (!renderOptions?.container) cleanup.add(() => container.remove());
    const mount = () =>
      render(createElement(plus.Provider, null, ui), { ...renderOptions, container });
    let result: ReturnType<typeof mount> | undefined;
    cleanup.add(() =>
      act(async () => {
        (result ?? render(null, { container })).unmount();
      }),
    );
    result = mount();
    await act(async () => {
      await plus.whenReady();
    });
    return {
      result,
      plus,
      router,
      async run<T>(operation: () => T | Promise<T>): Promise<T> {
        let pending: Promise<T>;
        await act(async () => {
          pending = Promise.resolve(operation());
        });
        return pending!;
      },
      dispose: () => cleanup.dispose(),
    };
  } catch (error) {
    return cleanup.fail(error);
  }
}
