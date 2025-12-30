'use client';
import { useEffect, useMemo, useState } from 'react';

type Draft = {
  id: string;
  conversation_id: string;
  phone: string;
  from_phone_number_id: string;
  user_id: string | null;
  draft_text: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  created_at: string;
};

function badgeClass(status: Draft['status']) {
  return `badge ${status}`;
}

export default function ReviewPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Draft['status']>('pending');

  const visible = useMemo(() => {
    if (filter === 'all') return drafts;
    return drafts.filter(d => d.status === filter);
  }, [drafts, filter]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drafts', { cache: 'no-store' });
      const json = await res.json();
      setDrafts(json.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function action(path: string, id: string) {
    await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await refresh();
  }

  async function sendApproved() {
    await fetch('/api/send-approved', { method: 'POST' });
    await refresh();
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Draft replies</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Approve drafts individually, then send all approved in one click. Nothing is sent without approval.
        </p>

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <button className="btn secondary" onClick={refresh}>Refresh</button>
            <button className="btn success" onClick={sendApproved}>Send all approved</button>
          </div>

          <div className="row" style={{ alignItems: 'center' }}>
            <span className="badge">Filter</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="sent">Sent</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        {loading && <p className="muted">Loading…</p>}
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {!loading && visible.length === 0 && <p className="muted">No drafts found for this filter.</p>}
      </div>

      {visible.map(d => (
        <div key={d.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{d.phone}</div>
                <span className={badgeClass(d.status)}>{d.status.toUpperCase()}</span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Conversation: {d.conversation_id}</div>
              <div className="muted" style={{ fontSize: 12 }}>From phoneNumberId: {d.from_phone_number_id}</div>
            </div>

            <div className="row" style={{ alignItems: 'start' }}>
              <button className="btn success" disabled={d.status !== 'pending'} onClick={() => action('/api/approve', d.id)}>Approve</button>
              <button className="btn danger" disabled={d.status !== 'pending'} onClick={() => action('/api/reject', d.id)}>Reject</button>
              <button className="btn secondary" disabled={d.status !== 'pending'} onClick={() => action('/api/rewrite', d.id)}>Rewrite</button>
            </div>
          </div>

          <hr className="sep" />
          <pre className="pre">{d.draft_text}</pre>
        </div>
      ))}
    </div>
  );
}
