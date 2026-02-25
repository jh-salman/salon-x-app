import dayjs from 'dayjs';

export interface CalendarEvent {
  id: string;
  title: string;
  clientName?: string;
  service?: string;
  start: Date;
  end: Date;
  color?: string;
  allDay?: boolean;
  isParked?: boolean;
}

function ev(
  id: string,
  title: string,
  date: dayjs.Dayjs,
  opts: { clientName?: string; service?: string; startH?: number; startM?: number; endH?: number; endM?: number; allDay?: boolean; color?: string; isParked?: boolean }
) {
  const { clientName, service, startH = 0, startM = 0, endH = 0, endM = 0, allDay = false, color = '#FA1BFE', isParked } = opts;
  return {
    id,
    title,
    clientName,
    service,
    start: date.hour(startH).minute(startM).toDate(),
    end: date.hour(endH).minute(endM).toDate(),
    allDay,
    color,
    isParked,
  };
}

// Event title = client name (must match MOCK_CLIENT_DETAILS.clientName for full client details on tap)
// clientName in ev() = service description shown on calendar
export const MOCK_EVENTS: CalendarEvent[] = [
  // Today – timed appointments (names match clients.ts for full Client Details)
  ev('ev-1', 'Sarah Johnson', dayjs(), { clientName: 'Balayage', service: 'Balayage', startH: 9, endH: 10, endM: 30, color: '#FA1BFE' }),
  ev('ev-2', 'Emma Williams', dayjs(), { clientName: 'Full color', service: 'Full color', startH: 11, endH: 12, color: '#25AFFF' }),
  ev('ev-3', 'Olivia Brown', dayjs(), { clientName: 'Foil highlights & Toner', service: 'Foil highlights', startH: 13, endH: 14, endM: 15, color: '#9DE684' }),
  ev('ev-4', 'Sophia Davis', dayjs(), { clientName: 'Haircut', service: 'Haircut', startH: 15, endH: 15, endM: 45, color: '#6C6C6C' }),
  ev('ev-5', 'Isabella Martinez', dayjs(), { clientName: 'Full balayage & style', service: 'Full balayage', startH: 16, endH: 18, color: '#FA1BFE' }),
  // Today – all-day
  ev('ev-6', 'Claire Mills', dayjs(), { allDay: true, color: '#FF7701' }),
  ev('ev-7', 'Joshua Mitchell', dayjs(), { allDay: true, color: '#FF7701' }),
  ev('ev-8', 'Nita Haredoo', dayjs(), { allDay: true, color: '#9DE684', isParked: true }),
  ev('ev-9', 'Amy Park', dayjs(), { allDay: true, color: '#FF7701' }),
  ev('ev-10', 'Ben Wu', dayjs(), { allDay: true, color: '#FF7701' }),
  // Tomorrow
  ev('ev-11', 'Sarah Johnson', dayjs().add(1, 'day'), { clientName: 'Root touch-up', service: 'Root touch-up', startH: 10, endH: 11, color: '#25AFFF' }),
  ev('ev-12', 'Emma Williams', dayjs().add(1, 'day'), { clientName: 'Cut & style', service: 'Cut & style', startH: 14, endH: 15, color: '#FA1BFE' }),
  ev('ev-13', 'Alex Brown', dayjs().add(1, 'day'), { allDay: true, color: '#FF7701' }),
  // Yesterday
  ev('ev-14', 'Olivia Brown', dayjs().subtract(1, 'day'), { clientName: 'Toner', service: 'Toner', startH: 11, endH: 11, endM: 30, color: '#9DE684' }),
  ev('ev-15', 'Sophia Davis', dayjs().subtract(1, 'day'), { allDay: true, color: '#FF7701' }),
  // 2 days from now
  ev('ev-16', 'Isabella Martinez', dayjs().add(2, 'day'), { clientName: 'Bridal trial', service: 'Bridal trial', startH: 16, endH: 17, color: '#FA1BFE' }),
];
