/**
 * components/shell/AgeGate.tsx — 18+ age-verification gate.
 *
 * A blocking modal overlay shown on entry until `settings.ageConfirmed` is true.
 * Hard requirement (docs/A11Y.md + plan): the disclaimer MUST state this is a
 * "simulated" demo with "no real money" and that play is "18+". All copy comes
 * from `lib/strings.ts` (ageGate + app.disclaimer) — no hardcoded copy here.
 *
 * Confirming calls `setSetting('ageConfirmed', true)` which persists durably via
 * the store, so the gate never re-appears for a returning confirmed user.
 *
 * PHASE-2 NOTE: `ageConfirmed` is stored in client-side localStorage and can be
 * set to `true` via DevTools. This is acceptable for the Phase-1 demo (no real
 * money). Before enabling any real-money flows in Phase 2, replace this gate with
 * a server-authoritative check (e.g. signed session claim) that cannot be bypassed
 * by editing localStorage.
 *
 * SSR-SAFETY / no flash:
 *   The store's `ageConfirmed` is seeded with a default but the REAL value only
 *   becomes known after `hydrate()` runs (in an effect). Rendering the gate
 *   before hydration would either (a) flash it then hide it for confirmed users,
 *   or (b) cause a server/client mismatch. So this component renders NOTHING
 *   until `hydrated` is true, then shows the gate only when `!ageConfirmed`.
 *   First paint (server + pre-hydration client) is therefore always empty —
 *   stable, no mismatch.
 *
 * The overlay style mirrors the prototype AuthModal chrome (fixed inset, blur,
 * `popIn` card) so the gate reads as part of the same shell. Every value is a
 * `var(--…)` token — never hardcoded hex.
 */

'use client';

import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/primitives/Button';
import { useApp } from '@/lib/store';
import { useStore } from '@/lib/store';
import STRINGS from '@/lib/strings';

export function AgeGate() {
  const app = useApp();
  // `hydrated` lives on its own slice; reading it here keeps the gate gated on
  // the real (post-hydrate) `ageConfirmed`, never the seed value.
  const hydrated = useStore((s) => s.hydrated);

  // Render nothing until we know the real persisted value (no flash, no SSR
  // mismatch — first paint is always empty on server and client).
  if (!hydrated) return null;
  if (app.settings.ageConfirmed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agegate-heading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(2,2,8,.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn .2s',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '90vw',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 30,
          boxShadow: 'var(--card-shadow)',
          animation: 'popIn .3s',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'var(--header-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
            boxShadow: 'var(--glow-accent)',
          }}
        >
          {Icon.shield({ size: 26, color: 'var(--accent-ink)' })}
        </div>
        <div id="agegate-heading" style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
          {STRINGS.ageGate.heading}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-mute)', margin: '6px 0 22px', lineHeight: 1.55 }}>
          {STRINGS.ageGate.body}
        </div>
        <Button
          full
          size="lg"
          onClick={() => app.setSetting('ageConfirmed', true)}
        >
          {STRINGS.ageGate.cta}
        </Button>
        <div style={{ fontSize: 11.5, color: 'var(--text-mute)', textAlign: 'center', marginTop: 18 }}>
          {STRINGS.app.disclaimer}
        </div>
      </div>
    </div>
  );
}

export default AgeGate;
