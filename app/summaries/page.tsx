'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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

type ResolvedRow = {
  phone: string;
  note: string | null;
  resolved_at: string;
};

type ContactSummary = {
  phone: string;
  contact_name: string;
  date_start: string;
  date_end: string;
  last_activity_at: string | null;
  conversation_count: number;
  topics: string[];
  needs_response: boolean;
  suppress_response: boolean;
  is_resolved: boolean;
  resolved_at?: string | null;
  needs_response_reason?: string | null;
  trigger_snippet?: string | null;
  rows: SummaryRow[];
};

function formatDT(dt?: string | null) {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function pickActivityTs(r: SummaryRow) {
  return r.last_message_at || r.created_at;
}

function avatarInitial(name: string) {
  const s = (name || '').trim();
  if (!s) return '?';
  return s[0].toUpperCase();
}

function groupByPhone(rows: SummaryRow[], resolvedMap: Map<string, ResolvedRow>): ContactSummary[] {
  const map = new Map<string, SummaryRow[]>();

  for (const r of rows) {
    const key = (r.phone || '').trim();
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const out: ContactSummary[] = [];
  for (const [phone, list] of map.entries()) {
    const sortedByActivity = [...list].sort(
      (a, b) => new Date(pickActivityTs(b)).getTime() - new Date(pickActivityTs(a)).getTime()
    );

    const name =
      sortedByActivity.find((r) => (r.contact_name || '').trim())?.contact_name?.trim() || phone;

    const activityTimes = list
      .map((r) => pickActivityTs(r))
      .filter(Boolean)
      .map((x) => new Date(x!).getTime())
      .filter((x) => Number.isFinite(x));

    const minTs = activityTimes.length ? Math.min(...activityTimes) : null;
    const maxTs = activityTimes.length ? Math.max(...activityTimes) : null;

    const topics = Array.from(
      new Set(
        list
          .flatMap((r) => (Array.isArray(r.topics) ? r.topics : []))
          .map((t) => (t || '').trim())
          .filter(Boolean)
      )
    );

    const needsResponseRows = list.filter((r) => r.needs_response && !r.suppress_response);
    const rawNeeds = needsResponseRows.length > 0;
    const suppress_response = list.every((r) => !!r.suppress_response);

    const res = resolvedMap.get(phone);
    const resolvedAtTs = res?.resolved_at ? new Date(res.resolved_at).getTime() : null;

    // "Resolved" hides needs-response if the latest activity is not newer than resolved_at.
    const is_resolved = !!resolvedAtTs && !!maxTs && maxTs <= resolvedAtTs;

    const needs_response = rawNeeds && !is_resolved;

    const reasonRow =
      needsResponseRows.find((r) => r.needs_response_reason) ||
      needsResponseRows.find((r) => r.last_inbound) ||
      sortedByActivity.find((r) => r.needs_response_reason) ||
      sortedByActivity.find((r) => r.last_inbound);

    const trigger_snippet = reasonRow?.last_inbound ? reasonRow.last_inbound.slice(0, 140) : null;

    out.push({
      phone,
      contact_name: name,
      date_start: minTs ? new Date(minTs).toLocaleDateString() : '—',
      date_end: maxTs ? new Date(maxTs).toLocaleDateString() : '—',
      last_activity_at: maxTs ? new Date(maxTs).toISOString() : null,
      conversation_count: list.length,
      topics,
      needs_response,
      suppress_response,
      is_resolved,
      resolved_at: res?.resolved_at ?? null,
      needs_response_reason: reasonRow?.needs_response_reason ?? null,
      trigger_snippet,
      rows: sortedByActivity,
    });
  }

  // Needs response first, then most recent activity
  out.sort((a, b) => {
    if (a.needs_response !== b.needs_response) return a.needs_response ? -1 : 1;
    const at = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const bt = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
    return bt - at;
  });

  return out;
}

function includesQuery(haystack: string, q: string) {
  return haystack.toLowerCase().includes(q.toLowerCase());
}

export default function SummariesPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [resolvedRows, setResolvedRows] = useState<ResolvedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResolved, setLoadingResolved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState('');

  // UI state
  const [query, setQuery] = useState('');
  const [filterNeeds, setFilterNeeds] = useState(false);
  const [filterSuppressed, setFilterSuppressed] = useState(false);
  const [filterResolved, setFilterResolved] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [expandedConvos, setExpandedConvos] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);

  async function loadSummaries() {
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

  async function loadResolved() {
    setLoadingResolved(true);
    try {
      const res = await fetch('/api/resolved', { cache: 'no-store' });
      const json = await res.json();
      setResolvedRows(json.data ?? []);
    } catch {
      // non-fatal
      setResolvedRows([]);
    } finally {
      setLoadingResolved(false);
    }
  }

  async function suppress(kind: 'conversation' | 'phone', value: string, reason: string) {
    const res = await fetch('/api/suppress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, value, reason }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert(json.error || 'Failed to suppress');
      return;
    }
    await Promise.all([loadSummaries(), loadResolved()]);
  }

  async function setResolved(phone: string, on: boolean) {
    if (on) {
      const res = await fetch('/api/resolved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, note: 'Marked resolved from Summaries' }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error || 'Failed to mark resolved');
        return;
      }
    } else {
      const res = await fetch('/api/resolved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error || 'Failed to unresolve');
        return;
      }
    }
    await loadResolved();
    await loadSummaries();
  }

  async function createDraft(conversation_id: string, phone: string) {
    const res = await fetch('/api/create-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id, phone }),
    });
    const json = await res.json();
    if (!json.ok && !json.alreadyExists) {
      if (json.suppressed) {
        alert(`Draft blocked: ${json.reason || 'suppressed'}`);
        return;
      }
      alert(json.error || 'Failed to create draft');
      return;
    }
    alert(json.alreadyExists ? 'Draft already exists for this conversation.' : 'Draft created!');
  }

  useEffect(() => {
    Promise.all([loadSummaries(), loadResolved()]);
  }, []);

  // Close panel on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedPhone(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const resolvedMap = useMemo(() => {
    const m = new Map<string, ResolvedRow>();
    for (const r of resolvedRows) m.set(r.phone, r);
    return m;
  }, [resolvedRows]);

  const contacts = useMemo(() => groupByPhone(rows, resolvedMap), [rows, resolvedMap]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (query.trim()) {
      const q = query.trim();
      list = list.filter((c) => {
        const blob = [
          c.contact_name,
          c.phone,
          c.topics.join(' '),
          c.rows[0]?.summary ?? '',
          c.rows[0]?.last_inbound ?? '',
        ].join(' | ');
        return includesQuery(blob, q);
      });
    }
    if (filterNeeds) list = list.filter((c) => c.needs_response);
    if (filterSuppressed) list = list.filter((c) => c.suppress_response);
    if (filterResolved) list = list.filter((c) => c.is_resolved);
    return list;
  }, [contacts, query, filterNeeds, filterSuppressed, filterResolved]);

  const needs = filtered.filter((c) => c.needs_response);
  const rest = filtered.filter((c) => !c.needs_response);

  const selected =
    selectedPhone
      ? filtered.find((c) => c.phone === selectedPhone) || contacts.find((c) => c.phone === selectedPhone)
      : null;

  // When opening a new panel, reset accordion state
  useEffect(() => {
    if (!selectedPhone) return;
    setExpandedConvos({});
    setTimeout(() => panelRef.current?.focus(), 0);
  }, [selectedPhone]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const needsCount = contacts.filter((c) => c.needs_response).length;
    const suppressedCount = contacts.filter((c) => c.suppress_response).length;
    const resolvedCount = contacts.filter((c) => c.is_resolved).length;
    return { total, needsCount, suppressedCount, resolvedCount };
  }, [contacts]);

  const bestDraftTarget = useMemo(() => {
    if (!selected) return null;
    const candidate =
      selected.rows.find((r) => r.needs_response && !r.suppress_response) ||
      selected.rows.find((r) => !r.suppress_response) ||
      selected.rows[0] ||
      null;
    return candidate ? { conversation_id: candidate.conversation_id, phone: selected.phone } : null;
  }, [selected]);

  return (
    <div className="grid">
      <div className="card">
        <div className="summariesHeader">
          <div>
            <h2 style={{ marginBottom: 6 }}>Summaries</h2>
            <p className="muted" style={{ marginTop: 0, maxWidth: 900 }}>
              One card per phone number, across <b>active</b> + <b>archived</b> messages. Needs-response contacts float to the top.
            </p>
          </div>

          <div className="summariesStats">
            <span className="pill" title="Total contacts in this view">👥 {stats.total} contacts</span>
            <span className="pill" title="Contacts flagged as needing a reply">❗ {stats.needsCount} need response</span>
            <span className="pill" title="Contacts where responses are suppressed">🔒 {stats.suppressedCount} suppressed</span>
            <span className="pill" title="Contacts you've marked resolved (until newer activity arrives)">✅ {stats.resolvedCount} resolved</span>
          </div>
        </div>

        <div className="summariesToolbar">
          <div className="row" style={{ alignItems: 'stretch' }}>
            <div className="field" style={{ minWidth: 260 }}>
              <label>Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contact, phone, topic, keyword…"
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'rgba(5,8,18,.65)',
                  color: 'var(--text)',
                  width: 'min(520px, 72vw)',
                }}
              />
            </div>

            <div className="field">
              <label>Run ID (optional)</label>
              <input
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                placeholder="paste run UUID"
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'rgba(5,8,18,.65)',
                  color: 'var(--text)',
                  minWidth: 260,
                }}
              />
            </div>

            <div className="field" style={{ alignSelf: 'end' }}>
              <label>&nbsp;</label>
              <div className="row" style={{ alignItems: 'center' }}>
                <button className="btn secondary" onClick={() => Promise.all([loadSummaries(), loadResolved()])} disabled={loading}>
                  {loading ? 'Loading…' : 'Apply'}
                </button>
                <a className="btn secondary" href="/review">
                  Go to Review
                </a>
              </div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="row" style={{ alignItems: 'center' }}>
              <button
                className={`chip ${filterNeeds ? 'active' : ''}`}
                onClick={() => setFilterNeeds((v) => !v)}
                type="button"
              >
                ❗ Needs response
              </button>
              <button
                className={`chip ${filterSuppressed ? 'active' : ''}`}
                onClick={() => setFilterSuppressed((v) => !v)}
                type="button"
              >
                🔒 Suppressed
              </button>
              <button
                className={`chip ${filterResolved ? 'active' : ''}`}
                onClick={() => setFilterResolved((v) => !v)}
                type="button"
              >
                ✅ Resolved
              </button>
              {(filterNeeds || filterSuppressed || filterResolved || query.trim()) && (
                <button
                  className="chip"
                  onClick={() => {
                    setFilterNeeds(false);
                    setFilterSuppressed(false);
                    setFilterResolved(false);
                    setQuery('');
                  }}
                  type="button"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Showing {filtered.length} contacts {loadingResolved ? '• syncing resolved…' : ''}
            </div>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {!loading && rows.length === 0 && <p className="muted">No summaries found.</p>}
      </div>

      {/* Needs response section */}
      {needs.length > 0 && (
        <div className="card">
          <div className="sectionHeader">
            <h2 style={{ margin: 0 }}>Needs response</h2>
            <span className="badge pending">{needs.length}</span>
          </div>
          <div className="cardsGrid">
            {needs.map((c) => (
              <button
                key={c.phone}
                className={`summaryCard urgent ${c.suppress_response ? 'suppressed' : ''}`}
                onClick={() => setSelectedPhone(c.phone)}
                type="button"
              >
                <div className="summaryCardTop">
                  <div className="avatar">{avatarInitial(c.contact_name)}</div>
                  <div className="summaryCardTitle">
                    <div className="nameRow">
                      <span className="name">{c.contact_name}</span>
                      {c.suppress_response && <span className="badge rejected">SUPPRESSED</span>}
                      <span className="badge pending">NEEDS RESPONSE</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {c.phone}
                    </div>
                  </div>
                </div>

                <div className="summarySnippet">{c.rows[0]?.summary || '(no summary)'}</div>

                {(c.needs_response_reason || c.trigger_snippet) && (
                  <div className="reason">
                    Because: {c.needs_response_reason || `“${c.trigger_snippet}…”`}
                  </div>
                )}

                <div className="topicsRow">
                  {c.topics.slice(0, 4).map((t) => (
                    <span key={t} className="badge">
                      {t}
                    </span>
                  ))}
                  {c.topics.length > 4 && <span className="badge">+{c.topics.length - 4}</span>}
                </div>

                <div className="summaryMeta">
                  {c.conversation_count} conversations • {c.date_start} – {c.date_end}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Everything else section */}
      <div className="card">
        <div className="sectionHeader">
          <h2 style={{ margin: 0 }}>All contacts</h2>
          <span className="badge">{rest.length}</span>
        </div>
        <div className="cardsGrid">
          {rest.map((c) => (
            <button
              key={c.phone}
              className={`summaryCard ${c.suppress_response ? 'suppressed' : ''}`}
              onClick={() => setSelectedPhone(c.phone)}
              type="button"
            >
              <div className="summaryCardTop">
                <div className="avatar">{avatarInitial(c.contact_name)}</div>
                <div className="summaryCardTitle">
                  <div className="nameRow">
                    <span className="name">{c.contact_name}</span>
                    {c.suppress_response && <span className="badge rejected">SUPPRESSED</span>}
                    {c.is_resolved && <span className="badge approved">RESOLVED</span>}
                    {!c.suppress_response && !c.needs_response && !c.is_resolved && <span className="badge sent">OK</span>}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {c.phone}
                  </div>
                </div>
              </div>

              <div className="summarySnippet">{c.rows[0]?.summary || '(no summary)'}</div>

              <div className="topicsRow">
                {c.topics.slice(0, 4).map((t) => (
                  <span key={t} className="badge">
                    {t}
                  </span>
                ))}
                {c.topics.length > 4 && <span className="badge">+{c.topics.length - 4}</span>}
              </div>

              <div className="summaryMeta">
                {c.conversation_count} conversations • {c.date_start} – {c.date_end}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <div
          className="panelBackdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedPhone(null);
          }}
        >
          <div className="sidePanel" role="dialog" aria-modal="true" tabIndex={-1} ref={panelRef}>
            <div className="panelHeader">
              <div className="panelHeaderLeft">
                <div className="avatar big">{avatarInitial(selected.contact_name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="panelTitleRow">
                    <div className="panelTitle" title={selected.contact_name}>
                      {selected.contact_name}
                    </div>
                    {selected.suppress_response && <span className="badge rejected">SUPPRESSED</span>}
                    {selected.is_resolved && <span className="badge approved">RESOLVED</span>}
                    {selected.needs_response && !selected.suppress_response && (
                      <span className="badge pending">NEEDS RESPONSE</span>
                    )}
                    {!selected.needs_response && !selected.suppress_response && !selected.is_resolved && (
                      <span className="badge sent">OK</span>
                    )}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {selected.phone}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    Last activity: {selected.last_activity_at ? formatDT(selected.last_activity_at) : '—'}
                  </div>
                  {selected.is_resolved && selected.resolved_at && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      Resolved at: {formatDT(selected.resolved_at)}
                    </div>
                  )}
                </div>
              </div>

              <button className="iconBtn" onClick={() => setSelectedPhone(null)} aria-label="Close">
                ✕
              </button>
            </div>

            {(selected.needs_response_reason || selected.trigger_snippet) && selected.needs_response && (
              <div className="panelCallout">
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Why it needs response</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {selected.needs_response_reason
                    ? selected.needs_response_reason
                    : `Last inbound: “${selected.trigger_snippet}…”`}
                </div>
              </div>
            )}

            {selected.topics.length > 0 && (
              <div>
                <div className="panelSectionTitle">Important topics</div>
                <div className="topicsRow" style={{ marginBottom: 14 }}>
                  {selected.topics.map((t) => (
                    <span key={t} className="badge">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="panelActions">
              <a className="btn secondary" href="/review">
                Review drafts
              </a>

              <button
                className="btn secondary"
                disabled={!bestDraftTarget || selected.suppress_response}
                onClick={() => {
                  if (!bestDraftTarget) return;
                  createDraft(bestDraftTarget.conversation_id, bestDraftTarget.phone);
                }}
                title={selected.suppress_response ? 'Responses are suppressed for this phone' : ''}
              >
                ✏️ Create draft
              </button>

              <button
                className="btn secondary"
                onClick={() => setResolved(selected.phone, !selected.is_resolved)}
                title="Hides needs-response until newer activity arrives"
              >
                {selected.is_resolved ? '↩️ Unresolve' : '✅ Mark resolved'}
              </button>

              <button
                className="btn danger"
                onClick={() => suppress('phone', selected.phone, 'Manually suppressed from Summaries')}
              >
                🔒 Suppress phone
              </button>
            </div>

            <hr className="sep" />

            <div className="panelSectionTitle">Conversations in this contact</div>
            <div className="panelList">
              {selected.rows.map((r) => {
                const open = !!expandedConvos[r.conversation_id];
                const canDraft = !r.suppress_response;
                return (
                  <div key={r.id} className="panelItem">
                    <button
                      className="panelItemTop"
                      onClick={() =>
                        setExpandedConvos((prev) => ({
                          ...prev,
                          [r.conversation_id]: !prev[r.conversation_id],
                        }))
                      }
                      type="button"
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="panelItemTitleRow">
                          <div className="panelItemTitle" title={r.date_range}>
                            {r.date_range || 'Conversation'}
                          </div>
                          <span className={`badge ${r.needs_response ? 'pending' : 'sent'}`}>
                            {r.needs_response ? 'NEEDS RESPONSE' : 'OK'}
                          </span>
                          {r.suppress_response && <span className="badge rejected">SUPPRESSED</span>}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Run: {r.run_id} • Convo: {r.conversation_id}
                        </div>
                        {r.last_message_at && (
                          <div className="muted" style={{ fontSize: 12 }}>
                            Last message: {formatDT(r.last_message_at)}
                          </div>
                        )}
                      </div>
                      <div className="chev">{open ? '▾' : '▸'}</div>
                    </button>

                    {open && (
                      <div className="panelItemBody">
                        {r.needs_response_reason && (
                          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                            Reason: {r.needs_response_reason}
                          </div>
                        )}

                        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 10 }}>
                          <div className="card" style={{ boxShadow: 'none' }}>
                            <h3>Last inbound</h3>
                            <pre className="pre">{r.last_inbound || '(none captured)'}</pre>
                          </div>
                          <div className="card" style={{ boxShadow: 'none' }}>
                            <h3>Last outbound</h3>
                            <pre className="pre">{r.last_outbound || '(none captured)'}</pre>
                          </div>
                          <div className="card" style={{ boxShadow: 'none' }}>
                            <h3>Summary</h3>
                            <pre className="pre">{r.summary}</pre>
                          </div>
                        </div>

                        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
                          <button
                            className="btn secondary"
                            disabled={!canDraft}
                            onClick={() => createDraft(r.conversation_id, r.phone)}
                            title={!canDraft ? 'This conversation is suppressed' : ''}
                          >
                            ✏️ Create draft
                          </button>

                          <button
                            className="btn danger"
                            onClick={() =>
                              suppress('conversation', r.conversation_id, 'Manually suppressed from Summaries')
                            }
                          >
                            🔒 Suppress conversation
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ height: 18 }} />
          </div>
        </div>
      )}
    </div>
  );
}
