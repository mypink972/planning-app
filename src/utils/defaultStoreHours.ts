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

export function getDefaultStoreHours(date: Date): DefaultHours | 'closed' {
  const dayOfWeek = date.getDay();
  return DEFAULT_STORE_HOURS[dayOfWeek];
}