
import { fetchConversations } from './openphone'
import { summarizeConversation, draftReply, needsResponse } from './perplexity'
import { supabase } from './db'

export async function runAgent({ startDate, endDate }: { startDate: string, endDate: string }) {
  const conversations = await fetchConversations(startDate, endDate)

  for (const convo of conversations) {
    const summary = await summarizeConversation(convo)

    await supabase.from('summaries').insert({
      conversation_id: convo.id,
      contact_name: convo.contactName,
      phone: convo.phone,
      summary: summary.text,
      topics: summary.topics
    })

    if (await needsResponse(convo)) {
      const draft = await draftReply(convo)
      await supabase.from('draft_replies').insert({
        conversation_id: convo.id,
        phone: convo.phone,
        draft_text: draft,
        status: 'pending'
      })
    }
  }
}
