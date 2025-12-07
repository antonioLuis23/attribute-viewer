// Label management functions for the attribute viewer extension

import type { ExtendedHTMLElement } from "./types";
import { state, labeledElements } from "./state";
import {
  getComputedZIndex,
  setupElementForLabel,
  insertLabelInElement,
  cleanupElementPosition,
  hasRestrictedContent,
  insertLabelForRestrictedElement,
  positionFixedLabel,
  isVoidElement,
  insertLabelForVoidElement,
} from "./dom-utils";

// Track elements with fixed labels for resize repositioning
const fixedLabelElements = new Set<ExtendedHTMLElement>();

// Handler for repositioning fixed labels on resize/scroll
let repositionHandler: (() => void) | null = null;

function setupRepositionListeners(): void {
  if (repositionHandler) return;

  repositionHandler = () => {
    fixedLabelElements.forEach((el) => {
      if (el.__testIdLabel) {
        positionFixedLabel(el.__testIdLabel, el);
      }
    });
  };

  window.addEventListener("resize", repositionHandler);
  window.addEventListener("scroll", repositionHandler, true); // Use capture for nested scrolls
}

function cleanupRepositionListeners(): void {
  if (repositionHandler && fixedLabelElements.size === 0) {
    window.removeEventListener("resize", repositionHandler);
    window.removeEventListener("scroll", repositionHandler, true);
    repositionHandler = null;
  }
}

export function createLabel(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  const attributeValue = el.getAttribute(state.customAttribute);
  if (!attributeValue) return;

  // Avoid duplicates
  if (extEl.__testIdLabel) return;

  const label = document.createElement("div");
  label.className = "testid-overlay-label";
  label.innerText = attributeValue;

  extEl.__testIdLabel = label;
  labeledElements.add(extEl);

  // Calculate and set z-index based on parent element
  const parentZIndex = getComputedZIndex(el);
  label.style.zIndex = String(parentZIndex + 1);

  // Check if element needs special handling
  const isRestricted = hasRestrictedContent(el);
  const isVoid = isVoidElement(el);

  if (isRestricted) {
    // For restricted elements (tr, table, ul, etc.), use fixed positioning
    insertLabelForRestrictedElement(label, el);
    fixedLabelElements.add(extEl);
    setupRepositionListeners();

    // Reposition after label is rendered to get correct height
    requestAnimationFrame(() => {
      positionFixedLabel(label, el);
    });
  } else if (isVoid) {
    // For void elements (input, textarea), use fixed positioning
    insertLabelForVoidElement(label, el);
    fixedLabelElements.add(extEl);
    setupRepositionListeners();

    // Reposition after label is rendered to get correct height
    requestAnimationFrame(() => {
      positionFixedLabel(label, el);
    });
  } else {
    // For normal elements, insert as child with relative positioning
    setupElementForLabel(el);
    insertLabelInElement(label, el);
  }

  // Set up hover listeners ONLY for hover mode
  if (state.displayMode === "hover") {
    const showHandler = (): void => {
      label.style.visibility = "visible";
    };
    const hideHandler = (): void => {
      label.style.visibility = "hidden";
    };

    // Add event listeners to the element
    extEl.__hoverHandlers = { show: showHandler, hide: hideHandler };
    el.addEventListener("mouseenter", showHandler);
    el.addEventListener("mouseleave", hideHandler);
  }

  // Apply border if enabled
  updateElementBorder(el);

  // Update visibility on next frame
  requestAnimationFrame(() => {
    updateLabelVisibility(el);
  });
}

export function removeLabel(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  if (!extEl.__testIdLabel) return;

  // Remove hover handlers
  if (extEl.__hoverHandlers) {
    el.removeEventListener("mouseenter", extEl.__hoverHandlers.show);
    el.removeEventListener("mouseleave", extEl.__hoverHandlers.hide);
    delete extEl.__hoverHandlers;
  }

  // Remove the label
  extEl.__testIdLabel.remove();
  delete extEl.__testIdLabel;

  // Clean up based on the type of label positioning used
  if (fixedLabelElements.has(extEl)) {
    fixedLabelElements.delete(extEl);
    cleanupRepositionListeners();
  } else {
    // Restore original position style for non-restricted elements
    cleanupElementPosition(el);
  }

  el.classList.remove("testid-border-highlight");

  labeledElements.delete(extEl);
}

export function updateLabelVisibility(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  if (!extEl.__testIdLabel) return;

  const label = extEl.__testIdLabel;

  if (state.displayMode === "off") {
    label.style.display = "none";
  } else if (state.displayMode === "hover") {
    // Use visibility instead of display so dimensions are always available
    label.style.display = "block";
    label.style.visibility = "hidden"; // Hidden by default, shown on hover
  } else {
    // always mode
    label.style.display = "block";
    label.style.visibility = "visible";
  }
}

export function updateElementBorder(el: HTMLElement): void {
  if (state.showBorders) {
    el.classList.add("testid-border-highlight");
  } else {
    el.classList.remove("testid-border-highlight");
  }
}

export function updateAllBorders(): void {
  const elements = document.querySelectorAll<HTMLElement>(
    `[${state.customAttribute}]`
  );
  elements.forEach(updateElementBorder);
}

export function cleanupAllLabels(): void {
  labeledElements.forEach((el) => {
    removeLabel(el);
  });
  labeledElements.clear();
  fixedLabelElements.clear();
  cleanupRepositionListeners();
}

export function updateAllLabels(): void {
  // If display mode is "off", remove all labels from DOM
  if (state.displayMode === "off") {
    labeledElements.forEach((el) => {
      removeLabel(el);
    });
    // Still apply borders if enabled
    updateAllBorders();
    return;
  }

  labeledElements.forEach((el) => {
    const extEl = el as ExtendedHTMLElement;
    const label = extEl.__testIdLabel;
    const modeMismatch = label && (label as any).__mode !== state.displayMode;
    const attributeMissing = !el.hasAttribute(state.customAttribute);
    const removedFromDom = !document.contains(el);

    if (modeMismatch || attributeMissing || removedFromDom) {
      removeLabel(el);
    }
  });

  const elements = document.querySelectorAll<HTMLElement>(
    `[${state.customAttribute}]`
  );
  elements.forEach((el) => {
    const extEl = el as ExtendedHTMLElement;
    if (!extEl.__testIdLabel) {
      createLabel(el);
    } else {
      updateLabelVisibility(el);
      updateElementBorder(el);
    }

    if (extEl.__testIdLabel) {
      (extEl.__testIdLabel as any).__mode = state.displayMode;
    }
  });
}
