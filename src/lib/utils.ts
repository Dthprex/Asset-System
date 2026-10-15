import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Sri Lankan Rupees (LKR)
 * e.g., 685000 -> "Rs. 685,000"
 */
export function formatLKR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rs. 0';
  }
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('LKR', 'Rs.');
}

/**
 * Format date in Asia/Colombo (Sri Lanka) Timezone
 */
export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return String(dateString);
  }
}

/**
 * Format datetime with time in Asia/Colombo Timezone
 */
export function formatDateTime(dateString: string | Date | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return String(dateString);
  }
}

/**
 * Calculate custody duration between two dates in human readable form
 */
export function calculateDuration(startDate: string, endDate?: string, referenceDate?: Date): string {
  if (!startDate) return '0 days';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : (referenceDate || (typeof window !== 'undefined' ? new Date() : start));
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
  
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today (less than 24h)';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  
  const months = Math.floor(diffDays / 30);
  const remDays = diffDays % 30;
  if (remDays === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  return `${months} ${months === 1 ? 'month' : 'months'} ${remDays} ${remDays === 1 ? 'day' : 'days'} (${diffDays} days total)`;
}

/**
 * Calculate remaining warranty days and status
 */
export function getWarrantyInfo(warrantyEndDate: string, referenceDate?: Date): {
  daysLeft: number;
  isExpired: boolean;
  statusText: string;
  badgeClass: string;
  dotClass: string;
} {
  if (!warrantyEndDate) {
    return {
      daysLeft: 0,
      isExpired: true,
      statusText: 'No Warranty Date',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
      dotClass: 'bg-slate-400',
    };
  }

  const end = new Date(warrantyEndDate);
  const today = referenceDate ? new Date(referenceDate) : (typeof window !== 'undefined' ? new Date() : new Date(warrantyEndDate));
  
  // Set both to midnight Asia/Colombo
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      daysLeft: diffDays,
      isExpired: true,
      statusText: `Expired (${Math.abs(diffDays)}d ago)`,
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/90',
      dotClass: 'bg-rose-500',
    };
  } else if (diffDays <= 30) {
    return {
      daysLeft: diffDays,
      isExpired: false,
      statusText: `Expiring Soon (${diffDays}d left)`,
      badgeClass: 'bg-amber-50 text-amber-900 border border-amber-200/90',
      dotClass: 'bg-amber-500',
    };
  } else {
    return {
      daysLeft: diffDays,
      isExpired: false,
      statusText: `Active (${Math.floor(diffDays / 30)}m left)`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90',
      dotClass: 'bg-emerald-500',
    };
  }
}

/**
 * Calculate next semi-annual routine date (+6 months)
 */
export function calculateNextBiannualDate(baseDateStr: string): string {
  const date = new Date(baseDateStr);
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + 6);
    return fallback.toISOString().slice(0, 10);
  }
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().slice(0, 10);
}

