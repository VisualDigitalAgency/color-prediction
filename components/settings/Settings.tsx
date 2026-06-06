'use client';
/**
 * components/settings/Settings.tsx — Settings screen.
 * Pass A inline-parity port. Depends on steps 6 (store) + 7 (primitives).
 *
 * Theme picker calls both useTheme().setTheme() (immediate CSS var update) and
 * app.setTheme() (store/persistence sync) so the change is instant and durable.
 */
import * as React from 'react';
import { useApp } from '@/lib/store/useApp';
import { useTheme } from '@/lib/theme';
import { Card } from '@/components/primitives/Card';
import { Icon } from '@/components/icons/Icon';
import { THEMES } from '@/lib/theme/themes';
import STRINGS from '@/lib/strings';
import type { ThemeId } from '@/types';

// Lifted from THEMES to apply as per-card backgrounds (not CSS vars).
const PREVIEW_SCREEN: Record<ThemeId, string> = {
  neon: 'radial-gradient(120% 80% at 50% -10%, #16123a 0%, #0a0a17 42%, #06060d 100%)',
  fintech: 'linear-gradient(180deg, #0e1117 0%, #0a0c11 100%)',
  cyber: 'radial-gradient(110% 75% at 80% -5%, #1a1150 0%, #0a0a24 45%, #04030f 100%)',
};

const PREVIEW_ACCENT: Record<ThemeId, string> = {
  neon: '#15e08a',
  fintech: '#e3b964',
  cyber: '#8b5cff',
};

// [accent, green, red, violet] swatches for the mini palette row.
const PREVIEW_SWATCHES: Record<ThemeId, [string, string, string, string]> = {
  neon: ['#15e08a', '#15e08a', '#ff3460', '#b14bff'],
  fintech: ['#e3b964', '#2fce97', '#ef6a72', '#8e7cf2'],
  cyber: ['#8b5cff', '#1fffb0', '#ff4d7d', '#8b5cff'],
};

const THEME_IDS: ThemeId[] = ['neon', 'fintech', 'cyber'];

// ── Small layout helpers ────────────────────────────────────────────────────

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: 760, margin: '0 auto' }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.09em',
        color: 'var(--text-mute)',
        textTransform: 'uppercase' as const,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

// ── Toggle switch (ARIA role="switch") ──────────────────────────────────────

interface ToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? 'var(--accent)' : 'var(--surface-3)',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          background: on ? 'var(--accent-ink)' : 'var(--text-mute)',
        }}
      />
    </button>
  );
}

// ── Setting row (icon + text + control) ─────────────────────────────────────

interface SettingRowProps {
  label: string;
  desc?: string;
  icon: React.ReactNode;
  control: React.ReactNode;
  divider?: boolean;
}

function SettingRow({ label, desc, icon, control, divider = false }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderBottom: divider ? '1px solid var(--border)' : 'none',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: 'var(--surface-2)',
          color: 'var(--accent-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>
          {label}
        </div>
        {desc && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-mute)',
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {desc}
          </div>
        )}
      </div>
      {control}
    </div>
  );
}

// ── Theme card ──────────────────────────────────────────────────────────────

interface ThemeCardProps {
  id: ThemeId;
  active: boolean;
  onClick: () => void;
}

function ThemeCard({ id, active, onClick }: ThemeCardProps) {
  const theme = THEMES[id];
  const accent = PREVIEW_ACCENT[id];
  const swatches = PREVIEW_SWATCHES[id];

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${theme.label} theme`}
      style={{
        background: PREVIEW_SCREEN[id],
        border: `2px solid ${active ? accent : 'transparent'}`,
        borderRadius: 'var(--radius)',
        padding: '16px 14px 14px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        outline: 'none',
        boxShadow: active ? `0 0 18px ${accent}55, var(--card-shadow)` : 'var(--card-shadow)',
        position: 'relative',
        minHeight: 88,
      }}
    >
      {/* Mini palette swatches */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {swatches.map((color, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: color,
              opacity: i === 3 && id !== 'cyber' ? 0.7 : 1,
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: '#f5f7ff' }}>
        {theme.label}
      </div>

      {active && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          {Icon.check({ size: 18, color: accent })}
        </div>
      )}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function Settings() {
  const app = useApp();
  const { setTheme: applyTheme } = useTheme();
  const s = app.settings;

  function handleTheme(id: ThemeId) {
    applyTheme(id);     // immediate CSS var update via ThemeProvider
    app.setTheme(id);   // persist to store state blob
  }

  return (
    <Wrap>
      {/* ── Theme picker ──────────────────────────────── */}
      <SectionLabel>{STRINGS.settings.themeLabel}</SectionLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {THEME_IDS.map((id) => (
          <ThemeCard
            key={id}
            id={id}
            active={s.theme === id}
            onClick={() => handleTheme(id)}
          />
        ))}
      </div>

      {/* ── Accessibility ─────────────────────────────── */}
      <SectionLabel>Accessibility</SectionLabel>
      <Card pad={0} style={{ marginBottom: 28 }}>
        <SettingRow
          label={STRINGS.settings.colorBlindLabel}
          desc={STRINGS.settings.colorBlindDesc}
          icon={Icon.eye({ size: 19 })}
          divider
          control={
            <Toggle
              on={s.colorBlindCue ?? false}
              onChange={(v) => app.setSetting('colorBlindCue', v)}
              label={STRINGS.settings.colorBlindLabel}
            />
          }
        />
        <SettingRow
          label={STRINGS.settings.reducedMotionLabel}
          desc={STRINGS.settings.reducedMotionDesc}
          icon={Icon.bolt({ size: 19 })}
          control={
            <Toggle
              on={s.reducedMotion ?? false}
              onChange={(v) => app.setSetting('reducedMotion', v)}
              label={STRINGS.settings.reducedMotionLabel}
            />
          }
        />
      </Card>

      {/* ── Account ───────────────────────────────────── */}
      <SectionLabel>Account</SectionLabel>
      <Card pad={0}>
        <SettingRow
          label={STRINGS.settings.ageConfirmedLabel}
          icon={Icon.shield({ size: 19 })}
          control={
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 999,
                color: s.ageConfirmed ? 'var(--green)' : 'var(--text-mute)',
                background: s.ageConfirmed ? 'rgba(21, 224, 138, 0.12)' : 'var(--surface-2)',
              }}
            >
              {s.ageConfirmed ? 'Confirmed' : 'Pending'}
            </div>
          }
        />
      </Card>
    </Wrap>
  );
}

export default Settings;
