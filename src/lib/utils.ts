import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOrdinal(num: number, lang: string): string {
  if (lang === 'en') {
    const j = num % 10, k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  }
  if (lang === 'ru') {
    return `${num}-й`;
  }
  
  // AZ by default
  const lastDigit = num % 10;
  if (lastDigit === 0) {
    const tens = num % 100;
    if (tens === 10 || tens === 30) return `${num}-cu`;
    if (tens === 40 || tens === 60 || tens === 90) return `${num}-cı`;
    if (tens === 20 || tens === 50 || tens === 70 || tens === 80) return `${num}-ci`;
    return `${num}-cü`; // 100, 200, 300
  }
  
  if ([1, 2, 5, 7, 8].includes(lastDigit)) return `${num}-ci`;
  if ([3, 4].includes(lastDigit)) return `${num}-cü`;
  if (lastDigit === 6) return `${num}-cı`;
  if (lastDigit === 9) return `${num}-cu`;
  
  return `${num}-ci`; // fallback
}
