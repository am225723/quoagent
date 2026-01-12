import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { upsertContactNameExplicitOnly } from '@/lib/contacts';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const sb = supabaseServer();
  const { data: suggestion, error } = await sb
    .from('contact_update_suggestions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!suggestion) return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });

  try {
    await upsertContactNameExplicitOnly(suggestion.phone, suggestion.inferred_name);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to update contact' }, { status: 500 });
  }

  const { error: updateError } = await sb
    .from('contact_update_suggestions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
