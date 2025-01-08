interface DefaultHours {
  start: string;
  end: string;
}

interface WeekdayHours {
  [key: number]: DefaultHours | 'closed';
}

// 0 = Dimanche, 1 = Lundi, etc.
export const DEFAULT_STORE_HOURS: WeekdayHours = {
  0: 'closed', // Dimanche
  1: { start: '09:00', end: '20:00' }, // Lundi
  2: { start: '09:00', end: '20:00' }, // Mardi
  3: { start: '09:00', end: '20:00' }, // Mercredi
  4: { start: '09:00', end: '20:00' }, // Jeudi
  5: { start: '09:00', end: '20:00' }, // Vendredi
  6: { start: '09:00', end: '20:30' }, // Samedi
};

export function getDefaultStoreHours(date: Date): string {
  const dayOfWeek = date.getDay();
  const hours = DEFAULT_STORE_HOURS[dayOfWeek];

  if (hours === 'closed') {
    return 'closed';
  }

  const { start, end } = hours;
  const [startHour, startMinute] = start.split(':');
  const [endHour, endMinute] = end.split(':');
  
  return `${startHour}:${startMinute}:${endHour}:${endMinute}`;
}