/** Primary accent swatches (Life Coach reference: rich purple, blood red, charcoal, lime). */
export const highlightColors = {
  richPurple: '#9333EA',
  bloodRed: '#BE123C',
  /** Light graphite accent — readable on #000 canvas. */
  charcoalAccent: '#A3A3A3',
  /** Dark matte black accent (darker than charcoal; still visible on black UI). */
  matteBlack: '#000000',
  limeNeon: '#C4FF3D',
  /** Legacy neon aliases — prefer theme primary where possible. */
  neonPink: '#FF18EC',
  neonBlue: '#25AFFF',
  neonOrange: '#FF7701',
} as const;

/** Default accent matches Theme screen default (rich purple). */
export const defaultHighlight = highlightColors.richPurple;

/** True-black canvas + slightly lifted surfaces (high contrast vs white type, WhatsApp-dark–like). */
export const colors = {
  background: '#000000',
  /** Cards, inputs, pills — one step above canvas so neon borders read clearly. */
  bg: '#0F1419',
  brand: '#25AFFF',
  /** App-wide primary accent (static default; runtime accent from ThemeContext). */
  primary: highlightColors.richPurple,
  border: {
    accent: '#14def3',
    divider: 'rgba(142, 142, 147, 0.5)',
    subtle20: 'rgba(255,255,255,0.20)',
    subtle18: 'rgba(255,255,255,0.18)',
    subtle14: 'rgba(255,255,255,0.14)',
    subtle12: 'rgba(255,255,255,0.12)',
    subtle10: 'rgba(255,255,255,0.10)',
    subtle08: 'rgba(255,255,255,0.08)',
  },
  /** Event/appointment colors – synced with highlightColors where applicable. */
  event: {
    purple: highlightColors.richPurple,
    blue: highlightColors.neonBlue,
    orange: highlightColors.neonOrange,
    green: '#9DE684',
    gray: 'rgba(108, 108, 108, 0.9)',
  },
  /** Parked list pill: dark purple fill + magenta border (matches time-indicator pill style). */
  parked: {
    background: '#4A3658',
    border: highlightColors.richPurple,
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
    active: highlightColors.richPurple,
    inactive: '#FFFFFF',
  },
  text: {
    primary: '#FFFFFF',
    /** Secondary lines: bright enough to read at a glance (not “dull grey”). */
    secondary: 'rgba(255,255,255,0.88)',
    muted: 'rgba(255,255,255,0.72)',
    quiet: 'rgba(255,255,255,0.55)',
    faint: 'rgba(255,255,255,0.45)',
    onGreen: '#061006',
    weekMuted: 'rgba(255,255,255,0.82)',
    /** Muted gray for tertiary metadata — still lighter than old #afafaf */
    mutedSecondary: '#B8C0C8',
  },
  /** Stylist overlay: card background, nav bar, header */
  surface: {
    card: 'rgba(15, 20, 25, 0.97)',
    nav: '#0A0C0E',
    header: '#726D6D',
    glass70: 'rgba(12, 12, 16, 0.70)',
    glass55: 'rgba(12, 12, 16, 0.55)',
    white10: 'rgba(255,255,255,0.10)',
    white06: 'rgba(255,255,255,0.06)',
    white04: 'rgba(255,255,255,0.04)',
  },
};
