/**
 * components/shell/MobileNav.tsx — placeholder.
 *
 * The full responsive mobile navigation (bottom tab bar / slide-out drawer +
 * bet-slip sheet) is built in step 13 (responsive pass), which MUST NOT touch
 * the ≥1100px desktop branch. Until then this renders nothing — the desktop
 * `<Sidebar/>` + `<TopBar/>` are the only shell chrome.
 *
 * It still ports the prototype `NAV` source of truth via `lib/nav.ts NAV_ITEMS`
 * (consumed in step 13) so the eventual drawer stays in sync with the sidebar.
 */

'use client';

export function MobileNav() {
  // Intentionally empty until step 13 (responsive pass).
  return null;
}

export default MobileNav;
