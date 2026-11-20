/**
 * Vue redirect, view, boundary and retained helpers.
 */
import {
  defineComponent,
  h,
  Fragment,
  onMounted,
  provide,
  inject,
  computed,
  shallowRef,
  watch,
  onUnmounted,
  ref,
  type Component,
  type PropType,
} from 'vue';
import type { PageTarget } from '../core/types.js';
import { ROUTER_PLUS_KEY } from './plugin.js';
import { RouterView, routeLocationKey, routerViewLocationKey } from './native-router.js';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
const nativeScopes = new WeakMap<
  import('../core/types.js').RouterPlus,
  RouteLocationNormalizedLoaded
>();
import { usePageContext, useRouterPlus } from './composables.js';

export const RouterPlusRedirect = defineComponent({
  name: 'RouterPlusRedirect',
  props: {
    to: { type: [String, Object] as PropType<PageTarget>, required: true },
    replace: { type: Boolean, default: true },
    state: { type: null, default: undefined },
  },
  setup(props) {
    const plus = useRouterPlus();
    onMounted(() => {
      void plus.navigate(props.to, { replace: props.replace, state: props.state });
    });
    return () => null;
  },
});

export const RouterPlusView = defineComponent({
  name: 'RouterPlusView',
  props: {
    view: { type: [Object, Function] as PropType<Component>, default: undefined },
    cache: { type: Boolean, default: false },
  },
  setup(props) {
    const plus = useRouterPlus(),
      context = usePageContext();
    const entries = new Map<
      string,
      { context: import('../core/types.js').PageContext; node: import('vue').VNode }
    >();
    const revision = ref(0);
    const stop = plus.subscribe((event) => {
      if (event.type === 'release') {
        entries.delete(event.instance.stateKey);
        revision.value++;
      }
    });
    onUnmounted(stop);
    return () =>
      h(RouterView, null, {
        default: ({
          Component,
          route,
        }: {
          Component: import('vue').VNode | undefined;
          route: { fullPath: string };
        }) => {
          void revision.value;
          const key = context.value.instance?.stateKey ?? context.value.path;
          const node = props.view ? h(props.view as Component) : Component;
          if (!node) return null;
          for (const [id, entry] of entries)
            if (id !== key && !entry.context.instance?.retained && !props.cache) entries.delete(id);
          if (route.fullPath === context.value.path)
            entries.set(key, { context: context.value, node });
          return h(
            Fragment,
            null,
            [...entries].map(([id, entry]) =>
              h(
                RouterPlusRetained,
                { key: id, active: id === key, context: entry.context },
                { default: () => entry.node },
              ),
            ),
          );
        },
      });
  },
});

const ScopedBoundary = defineComponent({
  name: 'RouterPlusBoundary',
  props: {
    context: {
      type: Object as PropType<import('../core/types.js').PageContext>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const plus = useRouterPlus();
    const context = usePageContext();
    const bound = plus.scope(props.context ?? context.value);
    const route = inject(routeLocationKey, null);
    const frozenRoute = shallowRef(
      nativeScopes.get(bound) ??
        (route
          ? {
              ...route,
              path: bound.getContext().pathname,
              fullPath: bound.getContext().path,
              params: bound.getContext().params,
              hash: bound.getContext().hash,
            }
          : null),
    );
    if (frozenRoute.value) nativeScopes.set(bound, frozenRoute.value);
    if (route) {
      watch(
        () => route.fullPath,
        () => {
          if (route.fullPath === bound.getContext().path) {
            frozenRoute.value = { ...route };
            nativeScopes.set(bound, frozenRoute.value);
          }
        },
        { flush: 'sync' },
      );
      provide(
        routeLocationKey,
        new Proxy({} as typeof route, {
          get(_target, key) {
            return Reflect.get(frozenRoute.value!, key);
          },
        }),
      );
      provide(
        routerViewLocationKey,
        computed(() => frozenRoute.value!),
      );
    }
    provide(ROUTER_PLUS_KEY, bound);
    const element = ref<HTMLElement | null>(null);
    let unregister: (() => void) | null = null;
    onMounted(() => {
      if (!context.value.instance) return;
      unregister = bound.registerHost({ root: () => element.value });
    });
    onUnmounted(() => {
      unregister?.();
      unregister = null;
    });
    return () => h('div', { ref: element, 'data-router-plus-boundary': '' }, slots.default?.());
  },
});

/** Re-key the scope provider when a reused view changes its page instance. */
export const RouterPlusBoundary = defineComponent({
  name: 'RouterPlusBoundary',
  props: {
    context: {
      type: Object as PropType<import('../core/types.js').PageContext>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const context = usePageContext();
    return () => {
      const value = props.context ?? context.value;
      return h(ScopedBoundary, { key: value.instance?.stateKey, context: value }, slots);
    };
  },
});

export const RouterPlusRetained = defineComponent({
  name: 'RouterPlusRetained',
  props: {
    active: { type: Boolean, required: true },
    context: {
      type: Object as PropType<import('../core/types.js').PageContext>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const current = usePageContext();
    const frozen = ref(props.context ?? current.value);
    watch(
      () => [props.active, props.context, current.value],
      () => {
        if (props.active) frozen.value = props.context ?? current.value;
      },
    );
    return () =>
      h(
        'div',
        {
          hidden: !props.active,
          'data-router-plus-retained': props.active ? 'active' : 'inactive',
        },
        h(RouterPlusBoundary, { context: frozen.value }, slots),
      );
  },
});
