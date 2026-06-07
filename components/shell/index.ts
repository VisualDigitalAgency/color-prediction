/**
 * components/shell — barrel for the app-shell chrome (Pass A inline-style port).
 *
 * Desktop (≥1100px) navigation + header + entry gate. The full responsive
 * mobile drawer/nav arrives in step 13; `MobileNav` is a minimal placeholder
 * until then.
 */

export { Sidebar } from './Sidebar';
export { TopBar } from './TopBar';
export type { TopBarProps } from './TopBar';
export { AgeGate } from './AgeGate';
export { MobileNav } from './MobileNav';
export { NavButton } from './NavButton';
export type { NavButtonProps } from './NavButton';
export { NavLogout } from './NavLogout';
export { VipMiniCard } from './VipMiniCard';
export { ErrorBoundary } from './ErrorBoundary';
