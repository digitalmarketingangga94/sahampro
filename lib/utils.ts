export function getLatestTradingDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // If Saturday (6), go back 1 day to Friday
  // If Sunday (0), go back 2 days to Friday
  if (dayOfWeek === 6) {
    today.setDate(today.getDate() - 1);
  } else if (dayOfWeek === 0) {
    today.setDate(today.getDate() - 2);
  }
  
  return today.toISOString().split('T')[0];
}

export function getDateNDaysAgo(n: number, referenceDate: string = getLatestTradingDate()): string {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}