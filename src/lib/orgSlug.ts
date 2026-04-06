/** Public site host: `{slug}.xsalonx.com` (DNS / routing is infra). */
export const PUBLIC_WEB_DOMAIN = 'xsalonx.com';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Normalize user input for org/salon subdomain slug. */
export function normalizePublicSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Validate Better Auth–style slug (DNS label). */
export function isValidPublicSlug(s: string): boolean {
  return s.length >= 2 && s.length <= 63 && SLUG_RE.test(s);
}

/** Fallback random slug when not using a custom step (legacy). */
export function makeOrganizationSlug(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base.length > 0 ? `${base}-${suffix}` : `salon-${suffix}`;
}
