'use client';
import { useState } from 'react';

export default function RunPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Run a cleanup</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Pick a date window. The agent fetches conversations and messages, creates summaries, detects threads needing a response,
          and drafts replies for approval.
        </p>

        <div className="row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Start date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>End date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn" disabled={busy || !startDate || !endDate} onClick={run}>
            {busy ? 'Running…' : 'Run agent'}
          </button>
        </div>

        <p className="muted" style={{ marginBottom: 0, marginTop: 12 }}>
          Tip: start with a 1–3 day window to validate the integration.
        </p>
      </div>

      {result && (
        <div className="card">
          <h2>Run result</h2>
          <pre className="pre">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
