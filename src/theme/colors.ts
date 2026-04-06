/** Neon highlight colors for orb, placement line, dots. Sync here for future color-request. */
export const highlightColors = {
  neonPink: '#FF18EC',
  neonBlue: '#25AFFF',
  neonOrange: '#FF7701',
} as const;

/** Default for current build (Boss: "right now just think with neon pink"). */
export const defaultHighlight = highlightColors.neonPink;

/** True-black canvas + slightly lifted surfaces (high contrast vs white type, WhatsApp-dark–like). */
export const colors = {
  background: '#000000',
  /** Cards, inputs, pills — one step above canvas so neon borders read clearly. */
  bg: '#0F1419',
  brand: '#25AFFF',
  /** App-wide primary accent (default neon pink). */
  primary: highlightColors.neonPink,
  border: {
    accent: '#14def3',
    divider: 'rgba(142, 142, 147, 0.5)',
  },
  /** Event/appointment colors – synced with highlightColors where applicable. */
  event: {
    purple: highlightColors.neonPink,
    blue: highlightColors.neonBlue,
    orange: highlightColors.neonOrange,
    green: '#9DE684',
    gray: 'rgba(108, 108, 108, 0.9)',
  },
  /** Parked list pill: dark purple fill + magenta border (matches time-indicator pill style). */
  parked: {
    background: '#4A3658',
    border: highlightColors.neonPink,
  },
  highlight: highlightColors,
  indicator: {
    badge: '#EA5547',
    current: '#EA5547',
  },
  nav: {
    icon: '#FFFFFF',
  },
  tabs: {
    active: highlightColors.neonPink,
    inactive: '#FFFFFF',
  },
  text: {
    primary: '#FFFFFF',
    /** Secondary lines: bright enough to read at a glance (not “dull grey”). */
    secondary: 'rgba(255,255,255,0.88)',
    muted: 'rgba(255,255,255,0.72)',
    weekMuted: 'rgba(255,255,255,0.82)',
    /** Muted gray for tertiary metadata — still lighter than old #afafaf */
    mutedSecondary: '#B8C0C8',
  },
  /** Stylist overlay: card background, nav bar, header */
  surface: {
    card: 'rgba(15, 20, 25, 0.97)',
    nav: '#0A0C0E',
    header: '#726D6D',
  },
};
