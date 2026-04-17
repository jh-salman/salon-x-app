/**
 * Backup of layoutAppointmentsInSlot (sorted by START time when building columns).
 * Replaced in CalendarMiddleSection.tsx with Life Coach version (sorted by END time).
 * Restore by copying the function body + interface back into CalendarMiddleSection.tsx if needed.
 */
interface AppointmentLike {
  startTime: Date;
  endTime: Date;
  id: string;
  [k: string]: unknown;
}

export interface PositionedAppointment {
  appointment: AppointmentLike;
  columnIndex: number;
  totalColumns: number;
  top: number;
  usesFullWidth: boolean;
  overlapColIdx: number;
  numOverlapCols: number;
}

const PIXELS_PER_MINUTE = 56 / 60;

export function layoutAppointmentsInSlot(appointments: AppointmentLike[]): PositionedAppointment[] {
  if (appointments.length === 0) return [];

  const sorted = [...appointments].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const columns: typeof appointments = [];

  for (const apt of sorted) {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const hasOverlap = columns[i].some(
        (existing) =>
          apt.startTime.getTime() < existing.endTime.getTime() &&
          apt.endTime.getTime() > existing.startTime.getTime()
      );
      if (!hasOverlap) {
        columns[i].push(apt);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([apt]);
    }
  }

  const totalColumns = columns.length;
  const adjacentOnlyColumns = new Set<number>();
  columns.forEach((col, colIdx) => {
    const ordered = [...col].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const allAdjacent =
      ordered.length >= 2 &&
      ordered.every((apt, i) => (i === 0 ? true : apt.startTime.getTime() === ordered[i - 1].endTime.getTime()));
    if (allAdjacent) {
      adjacentOnlyColumns.add(colIdx);
    }
  });

  const overlapColumns = columns
    .map((_, i) => i)
    .filter((i) => !adjacentOnlyColumns.has(i));
  const numOverlapCols = overlapColumns.length;

  return sorted.map((apt) => {
    const colIndex = columns.findIndex((col) => col.includes(apt));
    const minutesOffset = apt.startTime.getMinutes() + apt.startTime.getSeconds() / 60;
    const top = minutesOffset * PIXELS_PER_MINUTE;
    const usesFullWidth = adjacentOnlyColumns.has(colIndex);
    const overlapColIdx = overlapColumns.indexOf(colIndex);
    return {
      appointment: apt,
      columnIndex: colIndex,
      totalColumns,
      top,
      usesFullWidth,
      overlapColIdx: usesFullWidth ? -1 : overlapColIdx,
      numOverlapCols,
    };
  });
}
