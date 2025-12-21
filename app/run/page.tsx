
'use client'
import { useState } from 'react'

export default function RunPage() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  async function run() {
    await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end })
    })
    alert('Run started')
  }

  return (
    <div>
      <h2>Run Cleanup</h2>
      <input type="date" onChange={e => setStart(e.target.value)} />
      <input type="date" onChange={e => setEnd(e.target.value)} />
      <button onClick={run}>Run Agent</button>
    </div>
  )
}
