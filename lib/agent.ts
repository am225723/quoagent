import { listConversations, listMessages } from './openphone';
import { summarizeForCleanup } from './perplexity';
import { extractExplicitName } from './explicitName';
import { upsertContactNameExplicitOnly } from './contacts';
import { supabaseServer } from './supabaseServer';

function isoStart(d: string) { return new Date(d + 'T00:00:00.000Z').toISOString(); }
function isoEnd(d: string) { return new Date(d + 'T23:59:59.999Z').toISOString(); }

export async function runAgent({ startDate, endDate, resumeRunId }: { startDate: string; endDate: string; resumeRunId?: string | null; }) {
  const sb = supabaseServer();
  const maxPerRun = Number(process.env.MAX_CONVERSATIONS_PER_RUN ?? '25');

  const startIso = isoStart(startDate);
  const endIso = isoEnd(endDate);

  let runId = resumeRunId ?? null;
  let checkpoint: any = null;

  if (runId) {
    const r = await sb.from('runs').select('*').eq('id', runId).single();
    checkpoint = r.data?.checkpoint ?? null;
  } else {
    const created = await sb.from('runs').insert({ start_date: startDate, end_date: endDate, status: 'running', checkpoint: null }).select('id').single();
    runId = created.data!.id;
  }

  const convPage = await listConversations({
    updatedAfter: startIso,
    updatedBefore: endIso,
    maxResults: Math.min(100, maxPerRun),
    pageToken: checkpoint?.pageToken ?? null
  });

  let processed = 0;

  for (const convo of convPage.data ?? []) {
    if (processed >= maxPerRun) break;
    if (convo.deletedAt) continue;

    const participant = convo.participants?.[0];
    if (!participant) continue;

    let pageToken: string | null = null;
    const all: any[] = [];
    while (true) {
      const page = await listMessages({
        phoneNumberId: convo.phoneNumberId,
        participants: [participant],
        createdAfter: startIso,
        createdBefore: endIso,
        pageToken
      });
      all.push(...(page.data ?? []));
      if (!page.nextPageToken) break;
      pageToken = page.nextPageToken;
      if (all.length > 500) break;
    }

    const transcript = all
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(m => `[${m.createdAt}] ${m.direction === 'incoming' ? 'IN' : 'OUT'}: ${m.text}`)
      .join('\n');

    const s = await summarizeForCleanup(transcript || '(no messages in window)');
    const explicit = s.explicitName ?? extractExplicitName(transcript);

    if ((!convo.name || String(convo.name).toLowerCase().includes('unknown')) && explicit) {
      try { await upsertContactNameExplicitOnly(participant, explicit); } catch {}
    }

    await sb.from('summaries').insert({
      run_id: runId,
      conversation_id: convo.id,
      contact_name: convo.name ?? 'Unknown Contact',
      phone: participant,
      date_range: s.dateRange || `${startDate} → ${endDate}`,
      summary: s.summary,
      topics: Array.isArray(s.topics) ? s.topics : [],
      needs_response: !!s.needsResponse
    });

    if (s.needsResponse && s.draftReply) {
      await sb.from('draft_replies').insert({
        run_id: runId,
        conversation_id: convo.id,
        phone: participant,
        from_phone_number_id: convo.phoneNumberId,
        user_id: null,
        draft_text: s.draftReply,
        status: 'pending'
      });
    }

    processed += 1;
  }

  const newCheckpoint = { pageToken: convPage.nextPageToken ?? null, lastProcessedAt: new Date().toISOString() };
  await sb.from('runs').update({
    status: convPage.nextPageToken ? 'paused' : 'completed',
    checkpoint: newCheckpoint,
    updated_at: new Date().toISOString()
  }).eq('id', runId);

  return { runId, processed, nextPageToken: convPage.nextPageToken ?? null };
}
