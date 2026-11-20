/** Vue overlay host. Reactive appearance updates do not reinstall renderer resources. */
import {
  defineComponent,
  h,
  Teleport,
  shallowRef,
  onMounted,
  onUnmounted,
  watch,
  type PropType,
  type Component,
} from 'vue';
import type { HighlightComponentProps, OverlayHighlightRenderer } from '../dom/highlight.js';
import { mountOverlay, type OverlayMount } from '../dom/overlay.js';
import type { OverlayTheme } from '../dom/theme.js';
import { useRouterPlus } from './composables.js';

export const RouterPlusOverlay = defineComponent({
  name: 'RouterPlusOverlay',
  props: {
    root: { type: Object as PropType<Document | ShadowRoot | Element>, default: undefined },
    interactive: { type: Boolean, default: false },
    installRuntime: { type: Boolean, default: true },
    injectStyles: { type: Boolean, default: true },
    className: { type: String, default: undefined },
    highlightComponent: { type: [Object, Function] as PropType<Component>, default: undefined },
    theme: { type: Object as PropType<OverlayTheme>, default: undefined },
  },
  setup(props) {
    const plus = useRouterPlus();
    let mounted: OverlayMount | null = null;
    const highlightHost = shallowRef<HTMLElement | null>(null);
    const highlightState = shallowRef<HighlightComponentProps | null>(null);
    const renderer: OverlayHighlightRenderer = {
      mount(host) {
        highlightHost.value = host as HTMLElement;
      },
      render(state) {
        highlightState.value = state;
      },
      destroy() {
        highlightState.value = null;
        highlightHost.value = null;
      },
    };
    const update = () =>
      mounted?.update({
        interactive: props.interactive,
        className: props.className,
        theme: props.theme,
        highlightRenderer: props.highlightComponent ? renderer : undefined,
      });
    const mount = () => {
      mounted?.();
      mounted = mountOverlay(plus, {
        root: props.root,
        installRuntime: props.installRuntime,
        injectStyles: props.injectStyles,
      });
      update();
    };
    onMounted(mount);
    watch(
      () => [props.root, props.installRuntime, props.injectStyles],
      () => {
        if (mounted) mount();
      },
    );
    watch(
      () => [props.interactive, props.className, props.theme, props.highlightComponent],
      update,
      { deep: true },
    );
    onUnmounted(() => {
      mounted?.();
      mounted = null;
    });
    return () =>
      props.highlightComponent && highlightHost.value && highlightState.value
        ? h(
            Teleport,
            { to: highlightHost.value },
            h(props.highlightComponent, { ...highlightState.value }),
          )
        : null;
  },
});
