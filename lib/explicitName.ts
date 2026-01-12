type ExplicitNameMatch = { name: string; reason: string };

const PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  { regex: /\bmy name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i, reason: 'Name inferred from explicit introduction' },
  { regex: /\bthis is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i, reason: 'Name inferred from explicit introduction' },
  { regex: /\nit'?s\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i, reason: 'Name inferred from explicit introduction' },
  { regex: /\n\s*[-–—]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m, reason: 'Name inferred from message signature' }
];

export function extractExplicitNameWithReason(transcript: string): ExplicitNameMatch | null {
  for (const { regex, reason } of PATTERNS) {
    const m = transcript.match(regex);
    if (m?.[1]) return { name: m[1].trim(), reason };
  }
  return null;
}

export function extractExplicitName(transcript: string): string | null {
  return extractExplicitNameWithReason(transcript)?.name ?? null;
}
