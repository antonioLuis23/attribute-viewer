// DOM utility functions for the attribute viewer extension

// Elements that have restricted content models and can't contain arbitrary children
const RESTRICTED_ELEMENTS = new Set([
  "TR",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "COLGROUP",
  "COL",
  "UL",
  "OL",
  "DL",
  "SELECT",
  "OPTGROUP",
  "DATALIST",
  "MAP",
  "PICTURE",
  "SOURCE",
  "TRACK",
]);

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
 * Checks if an element has a restricted content model that doesn't allow
 * arbitrary children like divs.
 */
export function hasRestrictedContent(el: HTMLElement): boolean {
  return RESTRICTED_ELEMENTS.has(el.tagName);
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
 * Inserts a label for restricted elements using fixed positioning.
 * The label is appended to document.body and positioned above the element.
 */
export function insertLabelForRestrictedElement(
  label: HTMLDivElement,
  el: HTMLElement
): void {
  // Add special class for fixed positioning
  label.classList.add("testid-overlay-label--fixed");

  // Position the label above the element
  positionFixedLabel(label, el);

  // Append to body
  document.body.appendChild(label);
}

/**
 * Positions a fixed label above its target element.
 */
export function positionFixedLabel(
  label: HTMLDivElement,
  el: HTMLElement
): void {
  const rect = el.getBoundingClientRect();
  label.style.left = `${rect.left + window.scrollX}px`;
  label.style.top = `${rect.top + window.scrollY - label.offsetHeight}px`;

  // If label height is 0 (not yet rendered), use a reasonable default
  if (label.offsetHeight === 0) {
    label.style.top = `${rect.top + window.scrollY - 20}px`;
  }
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
