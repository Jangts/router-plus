/**
 * Vue link component with page / external / action targets.
 */
import { defineComponent, h, type PropType } from 'vue';
import type { LinkTarget, NavigateOptions } from '../core/types.js';
import { useRouterPlus } from './composables.js';

/** Preserve Vue's merged event-handler arrays for caller-supplied click behavior. */
function invokeClick(handlers: unknown, event: MouseEvent): void {
  for (const handler of Array.isArray(handlers) ? handlers : [handlers]) {
    if (Array.isArray(handler)) invokeClick(handler, event);
    else if (typeof handler === 'function') handler(event);
  }
}

export const RouterPlusLink = defineComponent({
  name: 'RouterPlusLink',
  inheritAttrs: false,
  props: {
    to: { type: [String, Object] as PropType<LinkTarget>, required: true },
    replace: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    reloadDocument: { type: Boolean, default: false },
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
            disabled: props.disabled,
            onClick: (event: MouseEvent) => {
              invokeClick(attrs.onClick, event);
              if (event.defaultPrevented || props.disabled) return;
              void plus.executeAction(resolution.actionId, resolution.payload);
            },
          },
          slots.default?.(),
        );
      }
      if (resolution.kind === 'external') {
        return h(
          'a',
          {
            ...attrs,
            href: props.disabled ? undefined : resolution.href,
            'aria-disabled': props.disabled || undefined,
            tabindex: props.disabled ? -1 : attrs.tabindex,
            onClick: (event: MouseEvent) => {
              invokeClick(attrs.onClick, event);
              if (props.disabled) event.preventDefault();
            },
          },
          slots.default?.(),
        );
      }
      return h(
        'a',
        {
          ...attrs,
          href: props.disabled ? undefined : resolution.href,
          'aria-disabled': props.disabled || undefined,
          tabindex: props.disabled ? -1 : attrs.tabindex,
          onClick: (event: MouseEvent) => {
            invokeClick(attrs.onClick, event);
            if (props.disabled) {
              event.preventDefault();
              return;
            }
            const target = attrs.target as string | undefined;
            if (
              props.reloadDocument ||
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.altKey ||
              event.ctrlKey ||
              event.shiftKey ||
              (target && target !== '_self') ||
              (attrs.download !== undefined && attrs.download !== false)
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
