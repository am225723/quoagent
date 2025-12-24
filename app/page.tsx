export default function Home() {
  return (
    <div className="grid">
      <div className="card">
        <h2>Welcome</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Run date-window cleanups, review drafts, and send approved replies via OpenPhone. Nothing is sent without approval.
        </p>
        <hr className="sep" />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3>Run</h3>
            <p className="muted">Generate summaries and draft replies for a date range.</p>
            <a className="btn" href="/run">Start a run</a>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3>Review</h3>
            <p className="muted">Approve, reject, or rewrite drafts.</p>
            <a className="btn secondary" href="/review">Review drafts</a>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h3>History</h3>
            <p className="muted">See run status and checkpoints.</p>
            <a className="btn secondary" href="/history">View history</a>
          </div>
        </div>
      </div>
    </div>
  );
}
