/** DOM-free fixture using the production Router Plus runtime. */
import { createRouterPlus } from '../core/router.js';
import type { CreateRouterPlusOptions } from '../core/types.js';
import { splitHref } from '../core/util.js';
import { createMemoryConnection } from './memory-connection.js';
import { createCleanup } from './lifecycle.js';
export type RouterPlusTestOptions = Omit<CreateRouterPlusOptions, 'initialLocation'> & {
  initial?: string;
};
export async function createRouterPlusTest(options: RouterPlusTestOptions) {
  const { initial = '/', ...core } = options;
  const cleanup = createCleanup();
  try {
    const connection = createMemoryConnection({ initial: splitHref(initial) });
    const plus = createRouterPlus({ globalKey: false, ...core });
    cleanup.add(() => plus.dispose());
    cleanup.add(plus.connect(connection));
    await plus.whenReady();
    return { plus, connection, dispose: () => cleanup.dispose() };
  } catch (error) {
    return cleanup.fail(error);
  }
}
