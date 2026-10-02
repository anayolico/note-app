/**
 * Frontend-Only Caching Utility
 * 
 * Implements a 2-tier client-side cache (In-Memory + LocalStorage)
 * with Stale-While-Revalidate pattern for instantaneous loading
 * and offline-resilient note management.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'mc_cache_';
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Retrieve cached data from memory or localStorage
 */
export const getCachedData = <T>(key: string): T | null => {
  // 1. Check in-memory cache first (0ms)
  const mem = memoryCache.get(key);
  if (mem) {
    return mem.data as T;
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      memoryCache.set(key, parsed);
      return parsed.data;
    }
  } catch (e) {
    console.warn('Failed to read from localStorage cache:', e);
  }

  return null;
};

/**
 * Store data into both in-memory cache and localStorage
 */
export const setCachedData = <T>(key: string, data: T): void => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  // 1. Save in memory
  memoryCache.set(key, entry);

  // 2. Persist in localStorage
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to persist in localStorage cache:', e);
  }
};

/**
 * Invalidate/clear cached items for a user or globally
 */
export const clearUserCache = (userId?: string): void => {
  memoryCache.clear();
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith(CACHE_PREFIX)) {
        if (!userId || k.includes(userId)) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to clear user cache:', e);
  }
};
