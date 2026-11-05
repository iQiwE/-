/**
 * Прибавляет месяцы с ограничением по последнему дню месяца:
 * 31.01 + 1 мес. = 28/29.02, а не 03.03.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

/** Начало текущих суток (00:00:00 локального времени). */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

