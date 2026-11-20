/**
 * Vue link component with page / external / action targets.
 */
import { defineComponent, h, type PropType } from 'vue';
import type { LinkTarget, NavigateOptions } from '../core/types.js';
import { useRouterPlus } from './composables.js';

export const RouterPlusLink = defineComponent({
  name: 'RouterPlusLink',
  inheritAttrs: false,
  props: {
    to: { type: [String, Object] as PropType<LinkTarget>, required: true },
    replace: { type: Boolean, default: false },
    state: { type: null, default: undefined },
    preventScrollReset: { type: Boolean, default: false },
    viewTransition: { type: Boolean, default: false },
    relative: { type: String as PropType<NavigateOptions['relative']>, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const plus = useRouterPlus();
    return () => {
      const resolution = plus.resolveLink(props.to);
      if (!resolution) return h('span', attrs, slots.fallback?.() ?? slots.default?.());
      if (resolution.kind === 'action') {
        return h(
          'button',
          {
            ...attrs,
            type: 'button',
            onClick: (event: MouseEvent) => {
              const custom = attrs.onClick as ((event: MouseEvent) => void) | undefined;
              custom?.(event);
              if (event.defaultPrevented || attrs.disabled) return;
              void plus.executeAction(resolution.actionId, resolution.payload);
            },
          },
          slots.default?.(),
        );
      }
      if (resolution.kind === 'external') {
        return h('a', { ...attrs, href: resolution.href }, slots.default?.());
      }
      return h(
        'a',
        {
          ...attrs,
          href: resolution.href,
          onClick: (event: MouseEvent) => {
            const custom = attrs.onClick as ((event: MouseEvent) => void) | undefined;
            custom?.(event);
            const target = attrs.target as string | undefined;
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.altKey ||
              event.ctrlKey ||
              event.shiftKey ||
              (target && target !== '_self') ||
              attrs.download !== undefined
            ) {
              return;
            }
            event.preventDefault();
            void plus.navigate(props.to as import('../core/types.js').PageTarget, {
              replace: props.replace,
              state: props.state,
              preventScrollReset: props.preventScrollReset,
              viewTransition: props.viewTransition,
              relative: props.relative,
            });
          },
        },
        slots.default?.(),
      );
    };
  },
});
