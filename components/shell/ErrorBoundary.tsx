'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  caught: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { caught: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return {
      caught: true,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  render() {
    if (!this.state.caught) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text)',
          padding: 32,
          textAlign: 'center',
          gap: 16,
        }}
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--red)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Something went wrong</div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-mute)',
            maxWidth: 400,
            lineHeight: 1.6,
          }}
        >
          {this.state.message || 'An unexpected error occurred on this screen.'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            borderRadius: 999,
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
