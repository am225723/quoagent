'use client';
import { useEffect, useMemo, useState } from 'react';

type SummaryRow = {
  id: string;
  run_id: string;
  conversation_id: string;
  contact_name: string;
  phone: string;
  date_range: string;
  summary: string;
  topics: string[];
  needs_response: boolean;
  created_at: string;
};

export default function SummariesPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = runId ? `?runId=${encodeURIComponent(runId)}` : '';
      const res = await fetch('/api/summaries' + qs, { cache: 'no-store' });
      const json = await res.json();
      setRows(json.data ?? []);
      if (json.error) setError(json.error);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load summaries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>Summaries</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          This view shows summaries even when there are no drafts. Use Run ID to filter to a specific run.
        </p>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <div className="field">
              <label>Run ID (optional)</label>
              <input
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                placeholder="paste run UUID"
                style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(5,8,18,.65)', color: 'var(--text)', minWidth: 320 }}
              />
            </div>
            <button className="btn secondary" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Apply'}</button>
          </div>
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {!loading && rows.length === 0 && <p className="muted">No summaries found.</p>}
      </div>

      {rows.map(r => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{r.contact_name} <span className="muted" style={{ fontWeight: 400 }}>({r.phone})</span></div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Date range: {r.date_range}</div>
              <div className="muted" style={{ fontSize: 12 }}>Run: {r.run_id}</div>
              <div className="muted" style={{ fontSize: 12 }}>Conversation: {r.conversation_id}</div>
            </div>
            <span className={`badge ${r.needs_response ? 'pending' : 'sent'}`}>{r.needs_response ? 'NEEDS RESPONSE' : 'NO RESPONSE NEEDED'}</span>
          </div>
          <hr className="sep" />
          <pre className="pre">{r.summary}</pre>
          {Array.isArray(r.topics) && r.topics.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {r.topics.map((t, i) => <span key={i} className="badge">{t}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
