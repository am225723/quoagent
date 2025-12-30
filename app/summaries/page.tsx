'use client';
import { useEffect, useState } from 'react';

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
  suppress_response?: boolean;
  last_inbound?: string | null;
  last_outbound?: string | null;
  last_message_at?: string | null;
  needs_response_reason?: string | null;
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

  async function suppress(kind: 'conversation'|'phone', value: string, reason: string) {
    const res = await fetch('/api/suppress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, value, reason })
    });
    const json = await res.json();
    if (!json.ok) {
      alert(json.error || 'Failed to suppress');
      return;
    }
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>Summaries</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          This page shows what the agent saw, including the last inbound/outbound messages. If a thread “Needs response”,
          you should see a pending draft in Review (unless it was suppressed).
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
            <a className="btn secondary" href="/review">Go to Review</a>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {!loading && rows.length === 0 && <p className="muted">No summaries found.</p>}
      </div>

      {rows.map(r => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                {r.contact_name} <span className="muted" style={{ fontWeight: 400 }}>({r.phone})</span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Date range: {r.date_range}</div>
              <div className="muted" style={{ fontSize: 12 }}>Run: {r.run_id}</div>
              <div className="muted" style={{ fontSize: 12 }}>Conversation: {r.conversation_id}</div>
              {r.last_message_at && <div className="muted" style={{ fontSize: 12 }}>Last message: {new Date(r.last_message_at).toLocaleString()}</div>}
            </div>

            <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
              <span className={`badge ${r.needs_response ? 'pending' : 'sent'}`}>{r.needs_response ? 'NEEDS RESPONSE' : 'NO RESPONSE NEEDED'}</span>
              {r.suppress_response && <span className="badge rejected">SUPPRESSED</span>}
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn danger" onClick={() => suppress('conversation', r.conversation_id, 'Manually suppressed from Summaries')}>Suppress convo</button>
                <button className="btn danger" onClick={() => suppress('phone', r.phone, 'Manually suppressed from Summaries')}>Suppress phone</button>
              </div>
            </div>
          </div>

          {r.needs_response_reason && (
            <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Reason: {r.needs_response_reason}
            </div>
          )}

          <hr className="sep" />

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div className="card" style={{ boxShadow: 'none' }}>
              <h3>Last inbound</h3>
              <pre className="pre">{r.last_inbound || '(none captured)'}</pre>
            </div>
            <div className="card" style={{ boxShadow: 'none' }}>
              <h3>Last outbound</h3>
              <pre className="pre">{r.last_outbound || '(none captured)'}</pre>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <pre className="pre">{r.summary}</pre>
          </div>

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
