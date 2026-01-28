
/**
 * Constant-time comparison to prevent timing attacks.
 * Returns true if strings match, false otherwise.
 *
 * Note: This implementation leaks the length of the strings, which is generally
 * acceptable for this use case. Ideally, we would hash both inputs first
 * to hide length, but for Basic Auth password checking against an env var,
 * this provides sufficient protection against timing side-channels on the content.
 */
export function secureCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }

  return result === 0;
}
