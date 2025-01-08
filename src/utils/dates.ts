// Fonction utilitaire pour capitaliser la première lettre
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getWeekDates(date: Date): Date[] {
  const current = new Date(date);
  const week = [];
  
  // Ajuster au lundi de la semaine
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Si c'est dimanche (0), on recule de 6 jours
  current.setDate(current.getDate() + diff);
  
  // Créer un tableau avec les 7 jours de la semaine
  for (let i = 0; i < 7; i++) {
    week.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return week;
}

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function calculateTotalHours(timeSlot?: { start: string; end: string }): number {
  if (!timeSlot) return 0;
  
  const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
  const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
  
  const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  return Math.round(totalMinutes / 60 * 100) / 100;
}

export function formatDateToFrench(date: Date, options: Intl.DateTimeFormatOptions): string {
  const formatted = date.toLocaleDateString('fr-FR', options);
  return capitalize(formatted);
}