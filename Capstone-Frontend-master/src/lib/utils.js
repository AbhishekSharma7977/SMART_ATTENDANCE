// ─── Utility Functions ───────────────────────────────────────────────────────
import { clsx } from 'clsx';

/**
 * Merge Tailwind classes safely, handling conflicts.
 * Usage: cn('base-class', conditional && 'active-class', 'override')
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Extract initials from a full name.
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Format a date to a human-readable time string.
 */
export function formatTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a date to a human-readable date string.
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Safe JSON parse with fallback.
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Debounce function.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
