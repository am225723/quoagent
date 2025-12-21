export function extractExplicitName(transcript: string): string | null {
  const patterns = [
    /\bmy name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /\bthis is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /\nit'?s\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /\n\s*[-–—]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m
  ];
  for (const p of patterns) {
    const m = transcript.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}
