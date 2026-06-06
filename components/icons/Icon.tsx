/**
 * components/icons/Icon.tsx — inline stroke icons.
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/app/icons.jsx`).
 * Each icon takes `{ size, color, sw, fill }` and inherits `currentColor` by
 * default so it tints with text color. Geometry kept identical (1.7 stroke,
 * round caps) to read at small sizes on dark surfaces.
 *
 * Pass A (inline-parity): structure + attributes are byte-identical to the
 * prototype `S`/`P`/`C` helpers; only `createElement(...)` became JSX and a
 * typed `IconProps` / `IconName` were added.
 */

import * as React from 'react';

export interface IconProps {
  /** Pixel size (width = height). */
  size?: number;
  /** Stroke (and, for filled icons, fill) color. Defaults to `currentColor`. */
  color?: string;
  /** Stroke width. */
  sw?: number;
  /** SVG `fill`. Defaults to `'none'`. */
  fill?: string;
  /** viewBox box size (square). */
  vb?: number;
  style?: React.CSSProperties;
}

// ── Primitive builders (port of the prototype S / P / C helpers) ────────────
function S({
  size = 22,
  color = 'currentColor',
  sw = 1.7,
  children,
  fill = 'none',
  vb = 24,
  style,
}: IconProps & { children?: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      fill={fill}
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

const P = (d: string, extra: React.SVGProps<SVGPathElement> = {}) => (
  <path d={d} {...extra} />
);
const C = (
  cx: number,
  cy: number,
  r: number,
  extra: React.SVGProps<SVGCircleElement> = {},
) => <circle cx={cx} cy={cy} r={r} {...extra} />;

/** Each icon is a render fn `(p: IconProps) => ReactElement`. */
type IconRenderer = (p?: IconProps) => React.ReactElement;

export const Icon = {
  home: (p) =>
    S({
      ...p,
      children: [
        P('M3 10.5 12 3l9 7.5', { key: 1 }),
        P('M5 9.5V20h14V9.5', { key: 2 }),
        P('M9.5 20v-5h5v5', { key: 3 }),
      ],
    }),
  game: (p) =>
    S({
      ...p,
      children: [
        <rect key={0} x={2.5} y={6.5} width={19} height={11} rx={5.5} />,
        P('M7 10v4M5 12h4', { key: 1 }),
        C(15.5, 11, 1.1, { key: 2, fill: p?.color || 'currentColor', stroke: 'none' }),
        C(18, 13, 1.1, { key: 3, fill: p?.color || 'currentColor', stroke: 'none' }),
      ],
    }),
  wallet: (p) =>
    S({
      ...p,
      children: [
        <rect key={0} x={3} y={5.5} width={18} height={14} rx={3.5} />,
        P('M3 9h18', { key: 1 }),
        C(17, 14, 1.2, { key: 2, fill: p?.color || 'currentColor', stroke: 'none' }),
      ],
    }),
  gift: (p) =>
    S({
      ...p,
      children: [
        P('M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z', { key: 0 }),
        <rect key={1} x={3} y={7.5} width={18} height={3.5} rx={1} />,
        P(
          'M12 7.5V20M12 7.5C12 5 10.5 3.5 9 3.5S6.5 5 8 6.2 12 7.5 12 7.5ZM12 7.5C12 5 13.5 3.5 15 3.5S17.5 5 16 6.2 12 7.5 12 7.5Z',
          { key: 2 },
        ),
      ],
    }),
  user: (p) =>
    S({
      ...p,
      children: [
        C(12, 8, 3.6, { key: 0 }),
        P('M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2', { key: 1 }),
      ],
    }),
  bell: (p) =>
    S({
      ...p,
      children: [
        P('M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z', { key: 0 }),
        P('M10 19a2 2 0 0 0 4 0', { key: 1 }),
      ],
    }),
  chevR: (p) => S({ ...p, children: P('M9 5l7 7-7 7') }),
  chevL: (p) => S({ ...p, children: P('M15 5l-7 7 7 7') }),
  chevD: (p) => S({ ...p, children: P('M5 9l7 7 7-7') }),
  plus: (p) => S({ ...p, children: P('M12 5v14M5 12h14') }),
  minus: (p) => S({ ...p, children: P('M5 12h14') }),
  arrowUp: (p) => S({ ...p, children: P('M12 19V5M6 11l6-6 6 6') }),
  arrowDown: (p) => S({ ...p, children: P('M12 5v14M6 13l6 6 6-6') }),
  clock: (p) =>
    S({ ...p, children: [C(12, 12, 8.5, { key: 0 }), P('M12 7.5V12l3 2', { key: 1 })] }),
  bolt: (p) =>
    S({
      ...p,
      fill: p?.color || 'currentColor',
      children: P('M13 2 4 13h6l-1 9 9-12h-6z', { stroke: 'none' }),
    }),
  trophy: (p) =>
    S({
      ...p,
      children: [
        P('M7 4h10v4a5 5 0 0 1-10 0z', { key: 0 }),
        P('M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3', { key: 1 }),
        P('M12 13v3M9 20h6M10 20l.5-4h3l.5 4', { key: 2 }),
      ],
    }),
  shield: (p) =>
    S({
      ...p,
      children: [
        P('M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z', { key: 0 }),
        P('M9 12l2 2 4-4', { key: 1 }),
      ],
    }),
  users: (p) =>
    S({
      ...p,
      children: [
        C(9, 8, 3, { key: 0 }),
        P('M3 19c.9-3 3.2-4.4 6-4.4S14.1 16 15 19', { key: 1 }),
        P('M16 5.2A3 3 0 0 1 16 14M17.5 19c-.3-1.6-.9-2.9-1.8-3.8', { key: 2 }),
      ],
    }),
  diamond: (p) =>
    S({
      ...p,
      children: P('M6 3h12l3 5-9 13L3 8z M3 8h18 M9 3 7 8l5 13 5-13-2-5'),
    }),
  copy: (p) =>
    S({
      ...p,
      children: [
        <rect key={0} x={8.5} y={8.5} width={11} height={11} rx={2.5} />,
        P('M5.5 15.5A2 2 0 0 1 4 13.5v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2', { key: 1 }),
      ],
    }),
  check: (p) => S({ ...p, children: P('M5 12.5l4.5 4.5L19 7') }),
  x: (p) => S({ ...p, children: P('M6 6l12 12M18 6L6 18') }),
  fire: (p) =>
    S({
      ...p,
      children: P(
        'M12 3c1 3-1 4-1 6 0 1.5 1 2.5 1 2.5S14 10 14 8c2 1.5 3.5 4 3.5 6.5a5.5 5.5 0 0 1-11 0C6.5 11 9 8 9 8s1 1 1 2.5C10 8 11 6 12 3Z',
      ),
    }),
  star: (p) =>
    S({
      ...p,
      children: P(
        'M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.5 9.7l5.9-.9z',
      ),
    }),
  history: (p) =>
    S({
      ...p,
      children: [
        P('M3.5 9A8.5 8.5 0 1 1 4 14', { key: 0 }),
        P('M3 5v4h4', { key: 1 }),
        P('M12 8v4.2l3 1.8', { key: 2 }),
      ],
    }),
  grid: (p) =>
    S({
      ...p,
      children: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'].map(
        (d, i) => P(d, { key: i }),
      ),
    }),
  settings: (p) =>
    S({
      ...p,
      children: [
        C(12, 12, 3, { key: 0 }),
        P(
          'M12 2.5v2.2M12 19.3v2.2M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6',
          { key: 1 },
        ),
      ],
    }),
  qr: (p) =>
    S({
      ...p,
      children: ['M4 4h5v5H4z', 'M15 4h5v5h-5z', 'M4 15h5v5H4z']
        .map((d, i) => P(d, { key: i }))
        .concat([P('M15 15h2v2h-2zM19 15v5M15 19h2', { key: 9 })]),
    }),
  phone: (p) =>
    S({
      ...p,
      children: [
        <rect key={0} x={6.5} y={2.5} width={11} height={19} rx={3} />,
        P('M10.5 18.5h3', { key: 1 }),
      ],
    }),
  lock: (p) =>
    S({
      ...p,
      children: [
        <rect key={0} x={5} y={10.5} width={14} height={9.5} rx={2.5} />,
        P('M8 10.5V8a4 4 0 0 1 8 0v2.5', { key: 1 }),
      ],
    }),
  coin: (p) =>
    S({
      ...p,
      fill: p?.fill || 'none',
      children: [
        C(12, 12, 8.5, { key: 0 }),
        P(
          'M12 7v10M9.5 9.2c0-1.1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.8c0 2.4-5 1.4-5 3.8 0 1.1 1.1 1.8 2.5 1.8s2.5-.6 2.5-1.7',
          { key: 1 },
        ),
      ],
    }),
  headset: (p) =>
    S({
      ...p,
      children: [
        P('M5 13v-1a7 7 0 0 1 14 0v1', { key: 0 }),
        <rect key={1} x={3.5} y={12.5} width={3.5} height={6} rx={1.5} />,
        <rect key={2} x={17} y={12.5} width={3.5} height={6} rx={1.5} />,
        P('M19 18.5v.5a3 3 0 0 1-3 3h-3', { key: 3 }),
      ],
    }),
  target: (p) =>
    S({
      ...p,
      children: [
        C(12, 12, 8.5, { key: 0 }),
        C(12, 12, 4.5, { key: 1 }),
        C(12, 12, 1, { key: 2, fill: p?.color || 'currentColor', stroke: 'none' }),
      ],
    }),
  refresh: (p) =>
    S({
      ...p,
      children: [
        P('M20 11a8 8 0 0 0-14-4M4 13a8 8 0 0 0 14 4', { key: 0 }),
        P('M18 3v4h-4M6 21v-4h4', { key: 1 }),
      ],
    }),
  eye: (p) =>
    S({
      ...p,
      children: [
        P('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z', {
          key: 0,
        }),
        C(12, 12, 2.6, { key: 1 }),
      ],
    }),
  trend: (p) =>
    S({
      ...p,
      children: [P('M3 16l5-5 3 3 7-8', { key: 0 }), P('M15 6h4v4', { key: 1 })],
    }),
} satisfies Record<string, IconRenderer>;

/** Union of every icon name — gives autocomplete + compile-time safety. */
export type IconName = keyof typeof Icon;

export default Icon;
