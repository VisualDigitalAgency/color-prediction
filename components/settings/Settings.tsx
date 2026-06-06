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

// Ordered list of theme IDs for the picker grid.
const THEME_IDS: ThemeId[] = ['neon', 'fintech', 'cyber'];

// ── Small layout helpers ────────────────────────────────────────────────────

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-6 px-4 app:px-7 pb-12 mx-auto max-w-[760px]">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-extrabold tracking-[0.09em] text-[var(--text-mute)] uppercase mb-3">
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
      className="w-11 h-[26px] rounded-[13px] border-0 cursor-pointer p-1 flex items-center shrink-0 outline-none"
      style={{
        background: on ? 'var(--accent)' : 'var(--surface-3)',
        justifyContent: on ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        className="size-[18px] rounded-[9px]"
        style={{ background: on ? 'var(--accent-ink)' : 'var(--text-mute)' }}
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
      className="flex items-center gap-3.5 py-3.5 px-4"
      style={{ borderBottom: divider ? '1px solid var(--border)' : 'none' }}
    >
      <div className="size-[38px] rounded-[11px] bg-[var(--surface-2)] text-[var(--accent-2)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[14.5px] font-bold text-text">
          {label}
        </div>
        {desc && (
          <div className="text-xs text-[var(--text-mute)] font-semibold mt-0.5">
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
  // Derive all preview values from the canonical theme object — single source of truth.
  const accent = theme.vars['--accent'];
  const swatches = [
    theme.vars['--accent'],
    theme.vars['--green'],
    theme.vars['--red'],
    theme.vars['--violet'],
  ] as const;

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${theme.label} theme`}
      className="rounded-[var(--radius)] pt-4 px-3.5 pb-3.5 cursor-pointer text-left outline-none relative"
      style={{
        background: theme.screen,
        border: `2px solid ${active ? accent : 'transparent'}`,
        boxShadow: active ? `0 0 18px ${accent}55, var(--card-shadow)` : 'var(--card-shadow)',
        minHeight: 88,
      }}
    >
      {/* Mini palette swatches */}
      <div className="flex gap-1.5 mb-3">
        {swatches.map((color, i) => (
          <div
            key={i}
            style={{ width: 14, height: 14, borderRadius: 7, background: color }}
          />
        ))}
      </div>

      {/* Label text uses the theme's own --text color so it's always readable. */}
      <div style={{ fontSize: 13, fontWeight: 800, color: theme.vars['--text'] }}>
        {theme.label}
      </div>

      {active && (
        <div className="absolute top-2.5 right-2.5">
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
      <div className="grid grid-cols-3 gap-3.5 mb-7">
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
