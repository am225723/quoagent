import { supabaseServer } from './supabaseServer';

const BASE = 'https://api.openphone.com/v1';
function headers() {
  const key = process.env.OPENPHONE_API_KEY;
  if (!key) throw new Error('Missing OPENPHONE_API_KEY');
  return { Authorization: key, 'Content-Type': 'application/json' };
}
async function postJson(url: string, body: any) {
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function patchJson(url: string, body: any) {
  const res = await fetch(url, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function upsertContactNameExplicitOnly(phone: string, fullName: string) {
  const sb = supabaseServer();
  const existing = await sb.from('contact_map').select('contact_id').eq('phone', phone).maybeSingle();
  const contactId = existing.data?.contact_id;

  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ').slice(1).join(' ') || null;

  if (!contactId) {
    const created = await postJson(BASE + '/contacts', {
      source: 'public-api',
      defaultFields: { firstName, lastName, phoneNumbers: [{ value: phone }] }
    });
    await sb.from('contact_map').upsert({ phone, contact_id: created.data.id });
    return created.data.id as string;
  }

  await patchJson(BASE + '/contacts/' + contactId, { defaultFields: { firstName, lastName } });
  return contactId as string;
}
