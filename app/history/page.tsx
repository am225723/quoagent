'use client';
import { useEffect, useState } from 'react';

type Run = { id: string; start_date: string; end_date: string; status: string; checkpoint: any; created_at: string; };

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/runs');
      const json = await res.json();
      setRuns(json.data ?? []);
    })();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Run history</h2>
      {runs.length === 0 ? <p>No runs yet.</p> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {runs.map(r => (
            <div key={r.id} style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{r.start_date} → {r.end_date}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>Status: {r.status}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>Created: {new Date(r.created_at).toLocaleString()}</div>
              {r.checkpoint && (
                <pre style={{ marginTop: 10, background: '#f6f6f6', padding: 10, borderRadius: 8, overflowX: 'auto' }}>
{JSON.stringify(r.checkpoint, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
