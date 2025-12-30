'use client';
import { useEffect, useState } from 'react';

type Suppression = { id: string; kind: 'phone'|'conversation'|'phrase'; value: string; reason: string | null; created_at: string; };

export default function SettingsPage() {
  const [items, setItems] = useState<Suppression[]>([]);
  const [kind, setKind] = useState<'phrase'|'phone'|'conversation'>('phrase');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/suppressions', { cache: 'no-store' });
    const json = await res.json();
    if (json.error) setError(json.error);
    setItems(json.data ?? []);
    setLoading(false);
  }

  async function add() {
    setError(null);
    const res = await fetch('/api/suppress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, value, reason })
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'Failed to add');
      return;
    }
    setValue(''); setReason('');
    await load();
  }

  async function remove(id: string) {
    const res = await fetch('/api/suppressions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    if (json.error) setError(json.error);
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>Response suppression</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Add block rules to prevent the agent from creating drafts for specific phones, conversations, or phrases.
          Phrase rules match anywhere in the conversation transcript (case-insensitive).
        </p>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        <div className="row">
          <div className="field">
            <label>Type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as any)}>
              <option value="phrase">Phrase</option>
              <option value="phone">Phone (E.164)</option>
              <option value="conversation">Conversation ID</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 320 }}>
            <label>Value</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={kind === 'phrase' ? 'e.g., "stop", "unsubscribe", "wrong number"' : (kind === 'phone' ? '+15551234567' : 'conversation id')}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(5,8,18,.65)', color: 'var(--text)' }}
            />
          </div>
          <div className="field" style={{ minWidth: 320 }}>
            <label>Reason (optional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="why suppress?"
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(5,8,18,.65)', color: 'var(--text)' }}
            />
          </div>
          <button className="btn" disabled={!value.trim()} onClick={add}>Add</button>
        </div>
      </div>

      <div className="card">
        <h2>Current suppressions</h2>
        {loading ? <p className="muted">Loading…</p> : items.length === 0 ? <p className="muted">None.</p> : (
          <div className="grid">
            {items.map(s => (
              <div key={s.id} className="card" style={{ boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{s.kind.toUpperCase()}: <span className="muted" style={{ fontWeight: 500 }}>{s.value}</span></div>
                    {s.reason && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Reason: {s.reason}</div>}
                    <div className="muted" style={{ fontSize: 12 }}>Created: {new Date(s.created_at).toLocaleString()}</div>
                  </div>
                  <button className="btn danger" onClick={() => remove(s.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
