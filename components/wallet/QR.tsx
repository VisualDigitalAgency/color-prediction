/**
 * components/wallet/QR.tsx
 * Deterministic pseudo-QR code from web-pages.jsx.
 * Not a real QR code — demo only, as documented in ADR 0006.
 */
import * as React from 'react';

export function QR({ data, size = 168 }: { data: string; size?: number }) {
  let h = 0;
  for (let i = 0; i < data.length; i++)
    h = ((h * 131 + data.charCodeAt(i)) >>> 0);
  const N = 21;
  const cells: [number, number][] = [];
  const rnd = () => {
    h = ((h * 1664525 + 1013904223) >>> 0);
    return h / 4294967296;
  };
  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let on: boolean;
      if (finder(r, c)) {
        const lr = r >= N - 7 ? r - (N - 7) : r;
        const lc = c >= N - 7 ? c - (N - 7) : c;
        on =
          lr === 0 ||
          lr === 6 ||
          lc === 0 ||
          lc === 6 ||
          (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        on = rnd() > 0.55;
      }
      if (on) cells.push([c, r]);
    }
  }
  const u = size / N;
  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#fff',
        borderRadius: 12,
        padding: 8,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {cells.map((p, i) => (
          <rect
            key={i}
            x={p[0] * u}
            y={p[1] * u}
            width={u}
            height={u}
            rx={u * 0.18}
            fill="#0a0a17"
          />
        ))}
      </svg>
    </div>
  );
}

export default QR;
