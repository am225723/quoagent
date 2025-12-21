
import fetch from 'node-fetch'

const API = 'https://api.perplexity.ai/chat/completions'

export async function summarizeConversation(convo: any) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: convo.text }],
      temperature: 0.2
    })
  })
  const json = await res.json()
  return { text: json.choices[0].message.content, topics: [] }
}

export async function needsResponse(convo: any) {
  return true
}

export async function draftReply(convo: any) {
  return "Thanks for reaching out — we’ll follow up shortly."
}
