/**
 * Cursor Control Utility
 * Enforces strict cursor behavior globally
 * - Text cursor only on editable fields
 * - Pointer cursor on clickable elements
 * - Default cursor everywhere else
 */

export function initializeCursorControl() {
  // Re-apply cursor rules on dynamic content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        enforceCursorRules(mutation.target as HTMLElement);
      }
    });
  });

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });

  // Initial enforcement
  enforceCursorRules(document.body);

  // Enforce on all existing elements
  document.addEventListener("mouseover", (e) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Check if element is editable
    const isEditable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.contentEditable === "true" ||
      target.contentEditable === "plaintext-only";

    // Check if element is clickable
    const isClickable =
      target instanceof HTMLButtonElement ||
      target instanceof HTMLAnchorElement ||
      (target.hasAttribute("role") &&
        ["button", "link", "tab", "menuitem"].includes(
          target.getAttribute("role") || "",
        )) ||
      target.hasAttribute("onclick") ||
      target.hasAttribute("tabindex");

    // Enforce cursor
    if (isEditable) {
      target.style.cursor = "text";
    } else if (isClickable) {
      target.style.cursor = "pointer";
    } else {
      target.style.cursor = "default";
    }
  });
}

function enforceCursorRules(element: HTMLElement) {
  const editableSelector =
    "input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']):not([type='color']), textarea, select, [contenteditable='true']";

  const clickableSelector =
    "button, a, [role='button'], [role='link'], [role='tab'], [role='menuitem'], summary, [onclick], [href]";

  // Find all editable elements and set cursor to text
  element.querySelectorAll(editableSelector).forEach((el) => {
    (el as HTMLElement).style.cursor = "text";
  });

  // Find all clickable elements and set cursor to pointer
  element.querySelectorAll(clickableSelector).forEach((el) => {
    (el as HTMLElement).style.cursor = "pointer";
  });

  // Set default cursor for all other elements
  element.querySelectorAll("*").forEach((el) => {
    const htmlEl = el as HTMLElement;
    const currentCursor = window.getComputedStyle(htmlEl).cursor;

    // If cursor is "auto" or "text" on non-editable element, change to default
    if (
      (currentCursor === "auto" || currentCursor === "text") &&
      !htmlEl.matches(editableSelector)
    ) {
      htmlEl.style.cursor = "default";
    }
  });
}

// Auto-initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCursorControl);
} else {
  initializeCursorControl();
}
