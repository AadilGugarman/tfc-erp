import { RefObject, useEffect } from "react";

interface Options {
  enabled?: boolean;
  selector?: string;
}

const DEFAULT_SELECTOR = [
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(
  container: HTMLElement,
  selector: string,
): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        el.offsetParent !== null
      );
    },
  );
}

function shouldSkipTarget(target: HTMLElement): boolean {
  return Boolean(target.closest('[data-kb-nav="off"]'));
}

export function useFormKeyboardNavigation(
  containerRef: RefObject<HTMLElement | null>,
  options: Options = {},
): void {
  const { enabled = true, selector = DEFAULT_SELECTOR } = options;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target || !container.contains(target)) return;
      if (shouldSkipTarget(target)) return;

      const isArrowUp = event.key === "ArrowUp";
      const isArrowDown = event.key === "ArrowDown";
      const isEnter = event.key === "Enter";

      const isTextarea = target.tagName === "TEXTAREA";
      if (isTextarea && !target.hasAttribute("data-enter-nav")) {
        return;
      }

      if (!isArrowUp && !isArrowDown && !isEnter) return;

      const controls = getFocusableElements(container, selector);
      const index = controls.indexOf(target);
      if (index === -1) return;

      let nextIndex = index;

      if (isArrowUp || (isEnter && event.shiftKey)) {
        nextIndex = Math.max(index - 1, 0);
      } else if (isArrowDown || isEnter) {
        nextIndex = Math.min(index + 1, controls.length - 1);
      }

      if (nextIndex === index) return;

      event.preventDefault();
      controls[nextIndex]?.focus();
      if (
        controls[nextIndex] instanceof HTMLInputElement ||
        controls[nextIndex] instanceof HTMLTextAreaElement
      ) {
        (
          controls[nextIndex] as HTMLInputElement | HTMLTextAreaElement
        ).select();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, [containerRef, enabled, selector]);
}
