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
    <div style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Run cleanup</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Start</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label>End</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <button disabled={busy || !startDate || !endDate} onClick={run} style={{ padding: '8px 12px' }}>
          {busy ? 'Running…' : 'Run agent'}
        </button>
      </div>

      <p style={{ margin: 0, opacity: 0.8 }}>
        Pulls conversations in the window, fetches messages, summarizes + drafts replies (pending approval).
        Approved replies are sent via OpenPhone and moved to Done using <code>setInboxStatus=done</code>.
      </p>

      {result && (
        <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
