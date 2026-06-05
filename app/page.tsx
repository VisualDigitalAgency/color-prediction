/* Placeholder landing — real Landing + AuthModal arrive in build step 9.
   Kept minimal so `next build`/`dev` is coherent right after init. */
export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", gap: 12 }} aria-hidden>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--green, #15e08a)" }} />
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--red, #ff3460)" }} />
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--violet, #b14bff)" }} />
      </div>
      <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800 }}>AuraWin</h1>
      <p style={{ margin: 0, opacity: 0.7, maxWidth: 460 }}>
        Project initialized. Screens are ported per <code>process.md</code>.
      </p>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.5 }}>
        Simulated demo — no real money. 18+.
      </p>
    </main>
  );
}
