'use client';
import { useEffect, useState } from 'react';

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

export default function ReviewPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drafts');
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
    <div style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Draft replies</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={refresh} style={{ padding: '8px 12px' }}>Refresh</button>
        <button onClick={sendApproved} style={{ padding: '8px 12px' }}>Send all approved</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && drafts.length === 0 && <p>No drafts yet.</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {drafts.map(d => (
          <div key={d.id} style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{d.phone}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Conversation: {d.conversation_id}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>From phoneNumberId: {d.from_phone_number_id}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Status: {d.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                <button disabled={d.status !== 'pending'} onClick={() => action('/api/approve', d.id)} style={{ padding: '6px 10px' }}>Approve</button>
                <button disabled={d.status !== 'pending'} onClick={() => action('/api/reject', d.id)} style={{ padding: '6px 10px' }}>Reject</button>
                <button disabled={d.status !== 'pending'} onClick={() => action('/api/rewrite', d.id)} style={{ padding: '6px 10px' }}>Rewrite</button>
              </div>
            </div>
            <pre style={{ marginTop: 10, background: '#f6f6f6', padding: 10, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
{d.draft_text}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
