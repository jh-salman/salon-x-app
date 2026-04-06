/**
 * US mobile numbers in E.164: +1 (NXX) NXX-XXXX
 * NXX = area code (2–9, then two digits); exchange first digit 2–9.
 */
const USA_E164 = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

export function isUsaE164(phone: string): boolean {
  const p = phone.trim();
  return USA_E164.test(p);
}
