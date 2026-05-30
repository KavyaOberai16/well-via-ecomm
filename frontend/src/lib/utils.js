import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format a numeric value as a currency string. Server is authoritative for money. */
export function formatPrice(value, currency = 'INR') {
  const n = Number(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Human stock label per the business rules. */
export function stockLabel(stock) {
  if (stock <= 0) return { text: 'Out of stock', tone: 'danger' };
  if (stock <= 5) return { text: `Only ${stock} left`, tone: 'warning' };
  return { text: 'In stock', tone: 'success' };
}
