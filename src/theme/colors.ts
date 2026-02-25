/** Neon highlight colors for orb, placement line, dots. Sync here for future color-request. */
export const highlightColors = {
  neonPink: '#FF18EC',
  neonBlue: '#25AFFF',
  neonOrange: '#FF7701',
} as const;

/** Default for current build (Boss: "right now just think with neon pink"). */
export const defaultHighlight = highlightColors.neonPink;

export const colors = {
  background: '#111',
  brand: '#25AFFF',
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
    secondary: '#FFFFFF',
    muted: '#FFFFFF',
    weekMuted: '#FFFFFF',
  },
};
