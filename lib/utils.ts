import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDefaultDate(): string {
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