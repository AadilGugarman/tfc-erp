import { RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      el.offsetParent !== null
    );
  });
}

interface Options {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onEscape?: () => void;
}

export function useFocusTrap({
  active,
  containerRef,
  onEscape,
}: Options): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusable = getFocusable(container);
    focusable[0]?.focus();

    const handler = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
        return;
      }

      if (event.key !== "Tab") return;

      const currentFocusable = getFocusable(containerRef.current);
      if (currentFocusable.length === 0) return;

      const currentIndex = currentFocusable.indexOf(
        document.activeElement as HTMLElement,
      );
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? currentFocusable.length - 1
          : currentIndex - 1
        : currentIndex === -1 || currentIndex === currentFocusable.length - 1
          ? 0
          : currentIndex + 1;

      event.preventDefault();
      currentFocusable[nextIndex]?.focus();
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previousFocusRef.current?.focus();
    };
  }, [active, containerRef, onEscape]);
}
