/**
 * Formats a time string to HH:mm format, removing any seconds
 */
export function formatTime(time: string): string {
  // Handle cases where time might include seconds
  const match = time.match(/^(\d{2}):(\d{2})/);
  if (!match) return time;
  return `${match[1]}:${match[2]}`;
}

/**
 * Validates if a time string is in HH:mm format
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Formats a time for display, ensuring HH:mm format
 */
export function formatTimeForDisplay(time: string | null | undefined): string {
  if (!time) return '';
  return formatTime(time);
}