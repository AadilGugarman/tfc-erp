import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook for debounced search with caching
 * Prevents excessive filter/query operations during typing
 *
 * Performance improvement:
 * - Without debouncing: 10+ filter operations per second while typing
 * - With debouncing (500ms): ~1-2 filter operations per complete search
 * - Memory: Caches recent searches to avoid re-filtering same query
 *
 * @param onSearch - Function that performs the search (takes query string)
 * @param debounceMs - Milliseconds to wait before executing search (default: 300)
 * @param maxCacheSize - Number of recent searches to cache (default: 10)
 *
 * @returns { query, setQuery, results, isSearching }
 *
 * Usage:
 * const { query, setQuery, results, isSearching } = useDebouncedSearch(
 *   (q) => filterParties(q),
 *   500
 * )
 */
export function useDebouncedSearch<T>(
  onSearch: (query: string) => T[],
  debounceMs: number = 300,
  maxCacheSize: number = 10,
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cache for search results to avoid redundant filtering
  const cacheRef = useRef<Map<string, T[]>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const performSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();

      // Check cache first
      if (cacheRef.current.has(trimmed)) {
        setResults(cacheRef.current.get(trimmed) || []);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      // Execute search in next microtask to not block UI
      Promise.resolve().then(() => {
        const searchResults = onSearch(trimmed);
        setResults(searchResults);

        // Update cache (maintain max size by removing oldest)
        if (cacheRef.current.size >= maxCacheSize) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
        cacheRef.current.set(trimmed, searchResults);

        setIsSearching(false);
      });
    },
    [onSearch, maxCacheSize],
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set new debounced timer
      timerRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, debounceMs);
    },
    [debounceMs, performSearch],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    results,
    isSearching,
    clearCache: () => cacheRef.current.clear(),
  };
}

/**
 * Hook for debounced filter with multiple conditions
 * More advanced than simple search - supports field-specific filtering
 *
 * @param items - Items to filter
 * @param filterFn - Function that returns true if item matches filter
 * @param debounceMs - Debounce delay
 * @returns { setFilterQuery, results, isFiltering }
 */
export function useDebouncedFilter<T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  debounceMs: number = 300,
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>(items);
  const [isFiltering, setIsFiltering] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const cacheRef = useRef<Map<string, T[]>>(new Map());

  const performFilter = useCallback(
    (filterQuery: string) => {
      if (!filterQuery.trim()) {
        setResults(items);
        setIsFiltering(false);
        return;
      }

      // Check cache
      if (cacheRef.current.has(filterQuery)) {
        setResults(cacheRef.current.get(filterQuery) || []);
        setIsFiltering(false);
        return;
      }

      setIsFiltering(true);

      // Defer filtering to prevent blocking
      Promise.resolve().then(() => {
        const filtered = items.filter((item) => filterFn(item, filterQuery));
        setResults(filtered);

        // Cache result
        if (cacheRef.current.size > 20) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
        cacheRef.current.set(filterQuery, filtered);

        setIsFiltering(false);
      });
    },
    [items, filterFn],
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        performFilter(newQuery);
      }, debounceMs);
    },
    [debounceMs, performFilter],
  );

  // Re-filter when items change
  useEffect(() => {
    cacheRef.current.clear();
    if (query) {
      performFilter(query);
    } else {
      setResults(items);
    }
  }, [items, query, performFilter]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    results,
    isFiltering,
  };
}

/**
 * Hook for autocomplete/search with suggestions
 * Combines debouncing with result limiting and highlighting
 *
 * @param items - Items to search
 * @param searchFields - Fields to search in each item
 * @param debounceMs - Debounce delay
 * @param maxResults - Max number of results to return (default: 10)
 */
export function useSearchWithSuggestions<T extends Record<string, any>>(
  items: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300,
  maxResults: number = 10,
) {
  const filterFn = useCallback(
    (item: T, query: string) => {
      const q = query.toLowerCase();
      return searchFields.some((field) => {
        const value = String(item[field] || "").toLowerCase();
        return value.includes(q);
      });
    },
    [searchFields],
  );

  const { query, setQuery, results, isFiltering } = useDebouncedFilter(
    items,
    filterFn,
    debounceMs,
  );

  const limitedResults = results.slice(0, maxResults);

  return {
    query,
    setQuery,
    results: limitedResults,
    totalMatches: results.length,
    isSearching: isFiltering,
  };
}
