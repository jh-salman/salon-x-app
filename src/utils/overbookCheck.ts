/**
 * Prevents a third overlapping appointment in the same time slot.
 * Returns true if adding an appointment at [newStart, newEnd] would result in 3+ overlapping appointments.
 */
export function wouldCauseThirdOverlap(
  events: { id?: string; start: Date; end: Date; allDay?: boolean }[],
  newStart: Date,
  newEnd: Date,
  excludeId?: string
): boolean {
  const timed = events.filter((e) => !e.allDay && e.start && e.end);
  const overlapping = timed.filter(
    (e) =>
      e.id !== excludeId &&
      newStart.getTime() < e.end.getTime() &&
      newEnd.getTime() > e.start.getTime()
  );
  return overlapping.length >= 2;
}
