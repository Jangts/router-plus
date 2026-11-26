/**
 * `RouterPlusRedirect`: navigate on mount without rendering anything.
 */
import { useEffect } from 'react';
import type { PageTarget } from '../core/types.js';
import { usePlusContext } from './provider.js';

export interface RouterPlusRedirectProps {
  readonly to: PageTarget;
  readonly replace?: boolean;
  readonly state?: unknown;
}

export function RouterPlusRedirect({ to, replace = true, state }: RouterPlusRedirectProps) {
  const plus = usePlusContext();
  useEffect(() => {
    let active = true;
    void plus
      .whenReady()
      .then(() => {
        if (active) void plus.navigate(to, { replace, state });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [plus, to, replace, state]);
  return null;
}
