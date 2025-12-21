const API = 'https://api.perplexity.ai/chat/completions';
function key() {
  const k = process.env.PERPLEXITY_API_KEY;
  if (!k) throw new Error('Missing PERPLEXITY_API_KEY');
  return k;
}
async function call(prompt: string) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Follow instructions exactly. Return JSON only.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json() as any;
  return String(json?.choices?.[0]?.message?.content ?? '');
}

export async function summarizeForCleanup(transcript: string) {
  const prompt = `Return valid JSON ONLY with keys: dateRange, summary, topics, explicitName (or null), needsResponse (boolean), draftReply (or null).
Rules:
- summary: 2-4 sentences, no speculation.
- topics: array of short strings, only explicit.
- explicitName: only if clearly stated, else null.
- needsResponse: true if last inbound asks a question/request and no later outbound response.
- draftReply: only if needsResponse true; short, professional.
Transcript:
${transcript}`;
  const out = await call(prompt);
  const m = out.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON returned');
  return JSON.parse(m[0]);
}
