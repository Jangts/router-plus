/**
 * `RouterPlusLink`: a link that understands page, external and business-action targets.
 *
 * Invalid targets degrade to text; action targets render a button; page links keep native
 * modifier/new-tab behaviour.
 */
import { createElement, type AnchorHTMLAttributes, type ReactNode } from 'react';
import type { LinkTarget, NavigateOptions } from '../core/types.js';
import { useRouterPlus } from './hooks.js';

export interface RouterPlusLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'onClick'
> {
  readonly to: LinkTarget;
  readonly children?: ReactNode;
  /** Rendered when the target cannot be resolved. */
  readonly fallback?: ReactNode;
  readonly disabled?: boolean;
  readonly replace?: boolean;
  readonly state?: unknown;
  readonly preventScrollReset?: boolean;
  readonly viewTransition?: boolean;
  readonly relative?: NavigateOptions['relative'];
  readonly onClick?: (event: import('react').MouseEvent<HTMLElement>) => void;
}

export function RouterPlusLink({
  to,
  children,
  fallback,
  replace,
  state,
  preventScrollReset,
  viewTransition,
  relative,
  onClick,
  disabled,
  className,
  title,
  target,
  download,
  ...rest
}: RouterPlusLinkProps) {
  const plus = useRouterPlus();
  const resolution = plus.resolveLink(to, { relative });
  const ariaLabel = rest['aria-label'];

  if (!resolution) {
    return createElement(
      'span',
      { className, title, 'aria-label': ariaLabel },
      fallback ?? children,
    );
  }

  if (resolution.kind === 'action') {
    return createElement(
      'button',
      {
        type: 'button',
        disabled,
        className,
        title,
        'aria-label': ariaLabel ?? resolution.actionId,
        onClick: (event: import('react').MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          void plus.executeAction(resolution.actionId, resolution.payload);
        },
      },
      children,
    );
  }

  if (resolution.kind === 'external') {
    return createElement(
      'a',
      { ...rest, className, title, target, download, href: resolution.href, onClick },
      children,
    );
  }

  return createElement(
    'a',
    {
      ...rest,
      className,
      title,
      target,
      download,
      href: resolution.href,
      onClick: (event: import('react').MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          (target && target !== '_self') ||
          (download !== undefined && download !== false)
        ) {
          return;
        }
        event.preventDefault();
        void plus.navigate(to as import('../core/types.js').PageTarget, {
          replace,
          state,
          preventScrollReset,
          viewTransition,
          relative,
        });
      },
    },
    children,
  );
}
