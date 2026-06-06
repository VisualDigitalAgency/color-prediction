/**
 * lib/nav.ts — screen-key ↔ route map for the App Router shell.
 *
 * The CDN React 18 prototype routed via an in-memory `app.navigate(screenKey)`
 * over keys like `home`, `game`, `wallet`, `deposit`, … (see WEB_TITLES in
 * `/tmp/proto_extract/web/web-shell.jsx`). Per ADR 0003 we route via real
 * App Router URLs instead, so this module is the single source of truth that
 * maps each prototype screen key to its route (and back).
 *
 * - `ROUTES`        screen-key → pathname (every prototype WEB_TITLES key).
 * - `NAV_ITEMS`     the ordered Sidebar nav list (key, route, label from
 *                   `lib/strings`, icon name, optional badge). Mirrors the
 *                   prototype `NAV` array order/labels exactly.
 * - `routeForKey`   screen key → pathname.
 * - `keyForPath`    pathname → screen key (active-item derivation from
 *                   `usePathname()`); treats `/deposit` + `/withdraw` as the
 *                   `wallet` group, matching the prototype's active highlight.
 *
 * Labels/titles come from `lib/strings.ts` — no hardcoded copy here.
 */

import type { IconName } from '@/components/icons/Icon';
import STRINGS from '@/lib/strings';

/** Prototype screen keys (WEB_TITLES keys), used as stable nav identifiers. */
export type ScreenKey =
  | 'home'
  | 'game'
  | 'wallet'
  | 'deposit'
  | 'withdraw'
  | 'history'
  | 'rewards'
  | 'referral'
  | 'vip'
  | 'profile'
  | 'settings';

/**
 * screen-key → pathname. The prototype `home` screen (Lobby) lives at
 * `/lobby`; every other key maps to `/<key>`.
 */
export const ROUTES: Record<ScreenKey, string> = {
  home: '/lobby',
  game: '/game',
  wallet: '/wallet',
  deposit: '/deposit',
  withdraw: '/withdraw',
  history: '/history',
  rewards: '/rewards',
  referral: '/referral',
  vip: '/vip',
  profile: '/profile',
  settings: '/settings',
};

/** TopBar / document titles keyed by screen (ported from WEB_TITLES). */
export const TITLES: Record<ScreenKey, string> = {
  home: STRINGS.titles.home,
  game: STRINGS.titles.game,
  wallet: STRINGS.titles.wallet,
  deposit: STRINGS.titles.deposit,
  withdraw: STRINGS.titles.withdraw,
  history: STRINGS.titles.history,
  rewards: STRINGS.titles.rewards,
  referral: STRINGS.titles.referral,
  vip: STRINGS.titles.vip,
  profile: STRINGS.titles.profile,
  settings: STRINGS.titles.settings,
};

/** A Sidebar navigation item. */
export interface NavItem {
  key: ScreenKey;
  route: string;
  label: string;
  icon: IconName;
  /** Optional small badge (e.g. the "LIVE" pulse on the game tab). */
  badge?: string;
}

/**
 * The ordered Sidebar nav list — order, labels and icons mirror the prototype
 * `NAV` array verbatim. Labels pull from `lib/strings.ts`.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'home', route: ROUTES.home, label: STRINGS.nav.lobby, icon: 'home' },
  { key: 'game', route: ROUTES.game, label: STRINGS.nav.wingo, icon: 'target', badge: STRINGS.nav.liveBadge },
  { key: 'wallet', route: ROUTES.wallet, label: STRINGS.nav.wallet, icon: 'wallet' },
  { key: 'rewards', route: ROUTES.rewards, label: STRINGS.nav.rewards, icon: 'gift' },
  { key: 'referral', route: ROUTES.referral, label: STRINGS.nav.inviteEarn, icon: 'users' },
  { key: 'vip', route: ROUTES.vip, label: STRINGS.nav.vipClub, icon: 'diamond' },
  { key: 'history', route: ROUTES.history, label: STRINGS.nav.history, icon: 'history' },
] as const;

/** Resolve a screen key to its pathname. */
export function routeForKey(key: ScreenKey): string {
  return ROUTES[key];
}

/** Reverse map (pathname → key), built once from ROUTES. */
const KEY_BY_PATH: Record<string, ScreenKey> = Object.fromEntries(
  (Object.entries(ROUTES) as [ScreenKey, string][]).map(([k, route]) => [route, k]),
) as Record<string, ScreenKey>;

/**
 * Resolve a pathname (from `usePathname()`) to its screen key, or `undefined`
 * for unknown paths. Matches the longest leading route segment so nested
 * routes (e.g. `/wallet/foo`) still resolve to `wallet`. `/deposit` and
 * `/withdraw` collapse into the `wallet` group to mirror the prototype's
 * active-highlight rule (`screen ∈ {deposit, withdraw} → wallet active`).
 */
export function keyForPath(pathname: string | null | undefined): ScreenKey | undefined {
  if (!pathname) return undefined;

  // Exact match first.
  const exact = KEY_BY_PATH[pathname];
  let key = exact;

  if (!key) {
    // Longest matching route prefix (handles nested routes).
    let best = '';
    for (const [route, k] of Object.entries(KEY_BY_PATH)) {
      if ((pathname === route || pathname.startsWith(route + '/')) && route.length > best.length) {
        best = route;
        key = k;
      }
    }
  }

  // Prototype grouping: deposit/withdraw highlight the Wallet nav item.
  if (key === 'deposit' || key === 'withdraw') return 'wallet';
  return key;
}
