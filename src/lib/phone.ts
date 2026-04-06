/** Normalize to US E.164 (+1XXXXXXXXXX) for the API. */
export function normalizeUsE164(input: string): string {
  const t = input.trim();
  const digits = t.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (t.startsWith('+')) return t.replace(/\s/g, '');
  return t;
}

export function isLikelyUsE164(s: string): boolean {
  const d = s.replace(/\D/g, '');
  return d.length === 10 || (d.length === 11 && d.startsWith('1'));
}
