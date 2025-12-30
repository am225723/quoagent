'use client';
import { useEffect, useState } from 'react';

type Run = { id: string; start_date: string; end_date: string; status: string; checkpoint: any; created_at: string; };

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/runs', { cache: 'no-store' });
    const json = await res.json();
    setRuns(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>Run history</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Runs store a checkpoint for pagination so you can resume if a run pauses.
        </p>
        <button className="btn secondary" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      {runs.length === 0 && !loading && (
        <div className="card">
          <h2>No runs yet</h2>
          <p className="muted">Run the agent from the Run page to populate history.</p>
        </div>
      )}

      {runs.map(r => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800 }}>{r.start_date} → {r.end_date}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Status: {r.status}</div>
              <div className="muted" style={{ fontSize: 12 }}>Created: {new Date(r.created_at).toLocaleString()}</div>
            </div>
            <span className={`badge ${r.status === 'completed' ? 'sent' : 'pending'}`}>{String(r.status).toUpperCase()}</span>
          </div>

          {r.checkpoint && (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Checkpoint</div>
              <pre className="pre">{JSON.stringify(r.checkpoint, null, 2)}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
