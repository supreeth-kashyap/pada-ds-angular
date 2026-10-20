/** A fixed "today" so the date stories render the same month on every run (and in visual tests). */
export const today = new Date(2026, 9, 20);

/** `today` moved by a number of days. */
export const addDays = (days: number, from: Date = today) =>
  new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);

/** Weekends are unavailable, as for a booking calendar. */
export const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
