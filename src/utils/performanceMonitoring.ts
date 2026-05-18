/**
 * Performance Monitoring & Diagnostics
 *
 * Development-only tools for detecting and diagnosing performance issues:
 * - Component render tracking
 * - Query performance monitoring
 * - Memory usage tracking
 * - Bundle size analysis
 */

/**
 * Simple performance marker
 * Mark time-sensitive operations for analysis
 *
 * Usage:
 * perf.mark('data-load-start')
 * await loadData()
 * perf.mark('data-load-end')
 * perf.measure('data-load', 'data-load-start', 'data-load-end')
 * const measure = performance.getEntriesByName('data-load')[0]
 * console.log(`Took ${measure.duration}ms`)
 */
export const perf = {
  mark: (name: string) => performance.mark(name),
  measure: (name: string, start: string, end: string) =>
    performance.measure(name, start, end),
  getAll: () => performance.getEntriesByType("measure"),
  clear: () => performance.clearMarks(),
  report: () => {
    const measures = performance.getEntriesByType("measure");
    measures.forEach((m) => {
      console.log(`${m.name}: ${m.duration.toFixed(2)}ms`);
    });
  },
};

/**
 * Component render counter
 * Helps identify unnecessary re-renders
 *
 * Usage in development:
 * const [renderCount, incrementRender] = useRenderCounter('PartyCard')
 * useEffect(() => { incrementRender() })
 * console.log(`Rendered ${renderCount} times`)
 */
export function useRenderCounter(componentName: string) {
  const countRef = React.useRef(0);

  React.useEffect(() => {
    countRef.current++;
    if (process.env.NODE_ENV === "development") {
      console.log(`[Render] ${componentName}: ${countRef.current}`);
    }
  });

  return countRef.current;
}

/**
 * Track component lifecycle for performance debugging
 *
 * Usage:
 * usePerformanceTracker('PartyCard', {
 *   party: partyData
 * })
 */
export function usePerformanceTracker(
  componentName: string,
  props: Record<string, any> = {},
) {
  const renderCountRef = React.useRef(0);
  const propsRef = React.useRef(props);

  React.useEffect(() => {
    renderCountRef.current++;

    const hasPropsChanged = !shallowEqual(propsRef.current, props);
    propsRef.current = props;

    if (process.env.NODE_ENV === "development") {
      const changed = hasPropsChanged ? " (props changed)" : "";
      console.log(
        `[Perf] ${componentName} rendered #${renderCountRef.current}${changed}`,
      );
    }
  });

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      return () => {
        console.log(
          `[Perf] ${componentName} unmounted (rendered ${renderCountRef.current} times)`,
        );
      };
    }
  }, [componentName]);
}

/**
 * Shallow equality check
 */
function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

/**
 * Memory usage tracker
 * Monitors memory growth over time
 *
 * WARNING: Only works in Chrome DevTools with memory API
 * Usage: Call periodically to track growth
 */
export async function trackMemoryUsage(label: string = "") {
  if (!("memory" in performance)) {
    console.warn("Memory API not available");
    return;
  }

  const memory = (performance as any).memory;
  const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
  const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
  const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

  console.log(
    `[Memory] ${label || "Current"}: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`,
  );
}

/**
 * Performance report generator
 * Creates summary of all measured operations
 */
export function generatePerformanceReport() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Performance reports only available in development");
    return;
  }

  const measures = performance.getEntriesByType("measure");
  const slowMeasures = measures
    .filter((m) => m.duration > 100)
    .sort((a, b) => b.duration - a.duration);

  console.group("📊 Performance Report");
  console.table(
    slowMeasures.map((m) => ({
      Operation: m.name,
      "Time (ms)": m.duration.toFixed(2),
      Status: m.duration > 500 ? "🔴 Slow" : "🟡 Medium",
    })),
  );
  console.groupEnd();

  return {
    total: measures.length,
    slow: slowMeasures.length,
    avgDuration:
      measures.reduce((sum, m) => sum + m.duration, 0) / measures.length,
    slowest: slowMeasures[0]?.name || "N/A",
    slowestDuration: slowMeasures[0]?.duration || 0,
  };
}

/**
 * Warn about performance anti-patterns
 * Runs in development to catch common issues
 */
export function checkPerformanceAntiPatterns() {
  if (process.env.NODE_ENV !== "development") return;

  const checks = {
    "Large bundle size":
      typeof window !== "undefined" &&
      (window as any).__WEBPACK_ASSETS__?.length > 2000,
    "Many listeners":
      typeof document !== "undefined" &&
      document.querySelectorAll("*").length > 5000,
    "Excessive depth":
      typeof document !== "undefined" &&
      document.body.innerHTML.length > 10000000,
  };

  Object.entries(checks).forEach(([check, hasIssue]) => {
    if (hasIssue) {
      console.warn(`⚠️ Performance: ${check}`);
    }
  });
}

/**
 * Log all store changes (for debugging)
 * Use with Zustand stores
 *
 * Usage:
 * const store = useAppStore.subscribe(
 *   (state, prevState) => logStoreChanges(state, prevState)
 * )
 */
export function logStoreChanges(state: any, prevState: any) {
  if (process.env.NODE_ENV !== "development") return;

  const changes: Record<string, any> = {};

  for (const key in state) {
    if (state[key] !== prevState[key]) {
      changes[key] = {
        from: prevState[key],
        to: state[key],
      };
    }
  }

  if (Object.keys(changes).length > 0) {
    console.group("[Store Changed]");
    console.table(changes);
    console.groupEnd();
  }
}

// Auto-check on page load in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(checkPerformanceAntiPatterns, 1000);
  });
}

// Export for manual use
export const performanceTools = {
  perf,
  trackMemoryUsage,
  generatePerformanceReport,
  checkPerformanceAntiPatterns,
  logStoreChanges,
  useRenderCounter,
  usePerformanceTracker,
};
