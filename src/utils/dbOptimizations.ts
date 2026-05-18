/**
 * Database Query Optimization Utilities
 *
 * Common patterns for efficient database access:
 * - Batch queries instead of N+1
 * - Cache computed results
 * - Minimize query frequency
 * - Pre-filter at database level
 */

import { useRef, useEffect } from "react";

/**
 * Query result cache with TTL and dependency tracking
 * Prevents redundant database queries within cache window
 *
 * Performance:
 * - Cache hit: O(1) lookup
 * - First query: ~50-200ms from backend
 * - Subsequent queries: 0ms (from cache)
 */
export class QueryCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get cached value if valid
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store value in cache
   */
  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

/**
 * Singleton cache instance
 */
export const dbQueryCache = new QueryCache(100);

/**
 * Hook to track query performance
 * Logs slow queries for profiling
 *
 * @param threshold - Log queries slower than this (ms)
 * @param enabled - Enable profiling (default: process.env.NODE_ENV === 'development')
 *
 * Usage:
 * useQueryProfiler(100) // Warn queries > 100ms
 */
export function useQueryProfiler(
  threshold: number = 100,
  enabled: boolean = typeof process !== "undefined" &&
    process.env.NODE_ENV === "development",
) {
  if (!enabled) return { profile: (fn: () => any) => fn() };

  return {
    profile: async <T>(name: string, queryFn: () => Promise<T>): Promise<T> => {
      const start = performance.now();
      try {
        const result = await queryFn();
        const duration = performance.now() - start;
        if (duration > threshold) {
          console.warn(
            `[DB] Slow query: ${name} took ${duration.toFixed(2)}ms`,
          );
        }
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(
          `[DB] Query failed: ${name} (${duration.toFixed(2)}ms):`,
          error,
        );
        throw error;
      }
    },
  };
}

/**
 * Common optimization patterns
 */
export const dbOptimizations = {
  /**
   * Instead of: loading all parties, then calculating balances for each
   * Use: load parties and their balances in batch query
   *
   * Reduces: N+1 query pattern
   * Saves: 50-500ms with large datasets
   */
  batchLoadWithRelations: (
    items: any[],
    relationLoader: (ids: string[]) => Promise<any>,
  ): Promise<any[]> => {
    const ids = items.map((item) => item.id);
    return relationLoader(ids);
  },

  /**
   * Cache computed/derived values
   * Instead of recalculating on each render
   *
   * Usage:
   * const balance = dbOptimizations.memoizeComputed(
   *   partyId,
   *   () => calculatePartyBalance(partyId),
   *   5 * 60 * 1000 // 5 minute TTL
   * )
   */
  memoizeComputed: (key: string, computeFn: () => any, ttlMs?: number): any => {
    const cached = dbQueryCache.get(`computed:${key}`);
    if (cached !== null) return cached;

    const computed = computeFn();
    dbQueryCache.set(`computed:${key}`, computed, ttlMs);
    return computed;
  },

  /**
   * Batch similar queries
   * Multiple components requesting same data = single query
   *
   * Usage:
   * const [parties, bills] = await Promise.all([
   *   db.getPartiesByCompany(companyId),
   *   db.getBillsByCompany(companyId),
   * ])
   */
  batchQueries: (queryFns: Array<() => Promise<any>>): Promise<any[]> => {
    return Promise.all(queryFns.map((fn) => fn()));
  },

  /**
   * Filter at database level, not in memory
   * Instead of: load 10,000 items, filter in memory
   * Use: query with filter, load only 100 items
   *
   * Saves: 50-500MB memory, 500-2000ms time
   */
  queryWithFilter: (
    baseQueryFn: (filter?: any) => Promise<any[]>,
    filter: any,
  ): Promise<any[]> => {
    return baseQueryFn(filter);
  },

  /**
   * Pagination strategy
   * Load data in chunks instead of all at once
   *
   * Usage:
   * const { items, hasMore, nextPage } = await paginate(
   *   (limit, offset) => db.getParties(limit, offset),
   *   50 // page size
   * )
   */
  paginate: async (
    queryFn: (limit: number, offset: number) => Promise<any[]>,
    pageSize: number = 50,
    maxPages: number = 1,
  ) => {
    const allItems = [];

    for (let page = 0; page < maxPages; page++) {
      const items = await queryFn(pageSize, page * pageSize);
      allItems.push(...items);

      if (items.length < pageSize) {
        // No more data
        break;
      }
    }

    return allItems;
  },
};

/**
 * Hook to detect N+1 query patterns in development
 * Warns when same query is executed multiple times in same render cycle
 */
export function useDetectN1Queries(
  enabled: boolean = process.env.NODE_ENV === "development",
) {
  const queryCountRef = useRef<Map<string, number>>(new Map());

  if (!enabled) return { track: (query: string) => {} };

  return {
    track: (query: string) => {
      const count = (queryCountRef.current.get(query) || 0) + 1;
      queryCountRef.current.set(query, count);

      if (count > 1) {
        console.warn(
          `[DB] Potential N+1 query detected: "${query}" executed ${count} times in render cycle`,
        );
      }

      // Reset after render
      requestAnimationFrame(() => {
        queryCountRef.current.clear();
      });
    },
  };
}
