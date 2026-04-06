/**
 * Parse "10:00 AM" / "2:30 PM" to today's Date (hour, minute in local time).
 * Returns null if parsing fails.
 */
export function parseTimeToToday(timeStr: string): Date | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const isPM = (match[3] || '').toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Get countdown label for display: "in 30 min", "Now", or "Started".
 */
export function getCountdownLabel(timeStr: string): string {
  const start = parseTimeToToday(timeStr);
  if (!start) return '';
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < -5) return 'Started';
  if (diffMin <= 5 && diffMin >= -5) return 'Now';
  if (diffMin < 60) return `in ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (m === 0) return `in ${h}h`;
  return `in ${h}h ${m}m`;
}

/**
 * Get hour (0-23) from "10:00 AM" style string for navigation params.
 */
export function getHourFromTimeString(timeStr: string): number {
  const d = parseTimeToToday(timeStr);
  return d ? d.getHours() : 9;
}
