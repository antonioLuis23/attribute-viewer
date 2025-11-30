// DOM utility functions for the attribute viewer extension

export function getComputedZIndex(el: HTMLElement): number {
  let current: HTMLElement | null = el;
  let maxZIndex = 0;

  while (current && current !== document.body) {
    const computed = window.getComputedStyle(current);
    const zIndex = computed.zIndex;

    if (zIndex !== "auto") {
      const numericZIndex = parseInt(zIndex, 10);
      if (!isNaN(numericZIndex)) {
        maxZIndex = Math.max(maxZIndex, numericZIndex);
      }
    }

    current = current.parentElement;
  }

  return maxZIndex;
}

/**
 * Sets up an element for label positioning by ensuring it has position context.
 * Only modifies position if it's currently static.
 */
export function setupElementForLabel(el: HTMLElement): void {
  const computedPosition = window.getComputedStyle(el).position;

  // Only set position if it's static (not already positioned)
  if (computedPosition === "static") {
    // Store original inline position (might be empty string)
    el.dataset.labelOriginalPosition = el.style.position || "";
    el.style.position = "relative";
  }
}

/**
 * Inserts a label as the first child of an element.
 */
export function insertLabelInElement(
  label: HTMLDivElement,
  el: HTMLElement
): void {
  el.insertBefore(label, el.firstChild);
}

/**
 * Cleans up the position style we added to an element.
 */
export function cleanupElementPosition(el: HTMLElement): void {
  if (el.dataset.labelOriginalPosition !== undefined) {
    el.style.position = el.dataset.labelOriginalPosition;
    delete el.dataset.labelOriginalPosition;
  }
}
