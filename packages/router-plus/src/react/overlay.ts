/** React overlay host. Portals preserve App context for registered highlight components. */
import { createElement, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { mountOverlay, type MountOverlayOptions, type OverlayMount } from '../dom/overlay.js';
import type { HighlightComponentProps, OverlayHighlightRenderer } from '../dom/highlight.js';
import { usePlusContext } from './provider.js';

export interface RouterPlusOverlayProps extends Omit<MountOverlayOptions, 'highlightRenderer'> {
  readonly highlightComponent?: ComponentType<HighlightComponentProps>;
}

export function RouterPlusOverlay({
  root,
  interactive,
  installRuntime,
  injectStyles,
  className,
  theme,
  highlightComponent,
}: RouterPlusOverlayProps) {
  const plus = usePlusContext();
  const mounted = useRef<OverlayMount | null>(null);
  const [slot, setSlot] = useState<{
    host: HTMLElement;
    props: HighlightComponentProps | null;
  } | null>(null);
  const renderer = useMemo<OverlayHighlightRenderer>(
    () => ({
      mount(host) {
        setSlot({ host: host as HTMLElement, props: null });
      },
      render(props) {
        setSlot((previous) => (previous ? { ...previous, props } : previous));
      },
      destroy() {
        setSlot(null);
      },
    }),
    [],
  );
  useEffect(() => {
    const handle = mountOverlay(plus, { root, installRuntime, injectStyles });
    mounted.current = handle;
    return () => {
      mounted.current = null;
      handle();
    };
  }, [plus, root, installRuntime, injectStyles]);
  useEffect(() => {
    mounted.current?.update({
      interactive,
      className,
      theme,
      highlightRenderer: highlightComponent ? renderer : undefined,
    });
  }, [
    plus,
    root,
    installRuntime,
    injectStyles,
    interactive,
    className,
    theme,
    highlightComponent,
    renderer,
  ]);
  return highlightComponent && slot?.props
    ? createPortal(createElement(highlightComponent, slot.props), slot.host)
    : null;
}
