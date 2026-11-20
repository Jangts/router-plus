/**
 * Default renderer presentation. App values become CSS variables, leaving visual
 * declarations overridable and target measurement independent of the chosen theme.
 */
/** High default for ordinary pages; App bounds can reserve higher layers. */
export const DEFAULT_OVERLAY_Z_INDEX = 10000;

export interface OverlayZIndexRange {
  readonly min?: number;
  readonly max?: number;
}

export interface OverlayTheme {
  /** A fixed CSS value, or inclusive bounds applied to the high renderer default. */
  readonly zIndex?: number | string | OverlayZIndexRange;
  readonly maskColor?: string;
  /** Shared spotlight cutout radius, independent of custom highlight content. */
  readonly maskRadius?: number | string;
  readonly surfaceColor?: string;
  readonly tipBorderColor?: string;
  readonly tipBorderWidth?: number | string;
  readonly textColor?: string;
  readonly radius?: number | string;
  readonly shadow?: string;
  readonly accentColor?: string;
  readonly highlightRadius?: number | string;
  readonly highlightBorderColor?: string;
  readonly highlightBorderWidth?: number | string;
  /** CSS length; a number is interpreted as pixels. Used by highlights and tours. */
  readonly highlightPadding?: number | string;
  readonly tipGap?: number | string;
}

/** CSS variable, numeric pixel length, and membership in the default component style contract. */
const themeProperties = {
  maskColor: ['--rp-mask', false, false],
  maskRadius: ['--rp-mask-radius', true, false],
  surfaceColor: ['--rp-surface', false, true],
  tipBorderColor: ['--rp-tip-border-color', false, true],
  tipBorderWidth: ['--rp-tip-border-width', true, true],
  textColor: ['--rp-text', false, true],
  radius: ['--rp-radius', true, true],
  shadow: ['--rp-shadow', false, true],
  accentColor: ['--rp-accent', false, true],
  highlightRadius: ['--rp-highlight-radius', true, true],
  highlightBorderColor: ['--rp-highlight-border-color', false, true],
  highlightBorderWidth: ['--rp-highlight-border-width', true, true],
  highlightPadding: ['--rp-highlight-padding', true, false],
  tipGap: ['--rp-tip-gap', true, true],
} as const satisfies Record<
  Exclude<keyof OverlayTheme, 'zIndex'>,
  readonly [string, boolean, boolean]
>;

type DefaultStyleKey = {
  [K in keyof typeof themeProperties]: (typeof themeProperties)[K][2] extends true ? K : never;
}[keyof typeof themeProperties];
export type DefaultHighlightStyles = Pick<OverlayTheme, DefaultStyleKey>;

/** Apply only the built-in component's visual fields, leaving overlay/geometry policy outside. */
export function applyDefaultHighlightStyles(
  element: HTMLElement,
  styles: DefaultHighlightStyles = {},
): void {
  for (const key of Object.keys(themeProperties) as (keyof typeof themeProperties)[]) {
    const [property, length, belongsToDefault] = themeProperties[key];
    if (!belongsToDefault) continue;
    const value = styles[key as DefaultStyleKey];
    if (value === undefined) element.style.removeProperty(property);
    else
      element.style.setProperty(
        property,
        typeof value === 'number' && length ? `${value}px` : String(value),
      );
  }
}

/** Replace supplied theme overrides; removed keys return to App CSS or renderer fallbacks. */
export function applyOverlayTheme(element: HTMLElement, theme: OverlayTheme = {}): void {
  const zIndex = theme.zIndex;
  const range = typeof zIndex === 'object' && zIndex !== null ? zIndex : undefined;
  // Validate before changing existing overrides so a rejected update leaves the theme intact.
  for (const value of range ? [range.min, range.max] : [zIndex]) {
    if (typeof value === 'number' && !Number.isSafeInteger(value))
      throw new RangeError('Overlay z-index must be a finite safe integer');
  }
  if (range?.min !== undefined && range.max !== undefined && range.min > range.max)
    throw new RangeError('Overlay z-index min must not exceed max');
  const zProperties = {
    '--rp-z-index': range ? undefined : zIndex,
    '--rp-z-index-min': range?.min,
    '--rp-z-index-max': range?.max,
  };
  for (const [property, value] of Object.entries(zProperties)) {
    if (value === undefined) element.style.removeProperty(property);
    else element.style.setProperty(property, String(value));
  }
  for (const key of Object.keys(themeProperties) as (keyof typeof themeProperties)[]) {
    const [property, length] = themeProperties[key];
    const value = theme[key];
    if (value === undefined) element.style.removeProperty(property);
    else
      element.style.setProperty(
        property,
        typeof value === 'number' && length ? `${value}px` : String(value),
      );
  }
}
