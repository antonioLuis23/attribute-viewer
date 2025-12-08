// Label management functions for the attribute viewer extension
// Uses Popover API for z-index + JS Positioning for reliability

import type { ExtendedHTMLElement } from "./types";
import { state, labeledElements } from "./state";

// Global hover state
let globalHoverListener: ((e: MouseEvent) => void) | null = null;
let currentHoveredLabelElement: ExtendedHTMLElement | null = null;

// Throttle utility
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function (this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function handleGlobalMouseMove(event: MouseEvent) {
  if (state.displayMode !== "hover") return;

  const x = event.clientX;
  const y = event.clientY;

  // 1. Find standard candidate via event target
  const target = event.target as HTMLElement;
  const standardCandidate = target.closest(
    `[${state.customAttribute}]`
  ) as ExtendedHTMLElement | null;

  // 2. Find manual candidate (disabled elements that might not fire events)
  let manualCandidate: ExtendedHTMLElement | null = null;
  let minArea = Infinity;

  // We only check elements that are likely to be problematic (disabled)
  // to avoid performance impact and overriding correct browser hit-testing for normal elements.
  for (const el of labeledElements) {
    if (
      el.matches(":disabled") ||
      el.getAttribute("aria-disabled") === "true"
    ) {
      const rect = el.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        // Check visibility/displayed?
        // getBoundingClientRect() returns 0s for display:none, but visibility:hidden has dims.
        // We assume labeledElements are visible-ish.

        const area = rect.width * rect.height;
        if (area < minArea) {
          minArea = area;
          manualCandidate = el;
        }
      }
    }
  }

  // 3. Determine best candidate
  // If we found a disabled element under cursor, it usually takes precedence
  // if it's "inside" or "on top" of the standard candidate.
  // Using area as a proxy for "more specific descendent".

  let finalCandidate = standardCandidate;

  if (manualCandidate) {
    if (!standardCandidate) {
      finalCandidate = manualCandidate;
    } else {
      // If we have both, prefer the smaller one (likely the child)
      const standardRect = standardCandidate.getBoundingClientRect();
      const standardArea = standardRect.width * standardRect.height;

      // If manual candidate is smaller (or similar size), use it.
      // This handles the case of "Disabled Button inside Div".
      if (minArea <= standardArea) {
        finalCandidate = manualCandidate;
      }
    }
  }

  if (finalCandidate === currentHoveredLabelElement) return;

  // Hide previous label
  if (currentHoveredLabelElement && currentHoveredLabelElement.__testIdLabel) {
    try {
      currentHoveredLabelElement.__testIdLabel.hidePopover();
    } catch {
      // Ignore
    }
  }

  // Update current
  currentHoveredLabelElement = finalCandidate;

  // Show new label if it exists and is tracked
  if (
    currentHoveredLabelElement &&
    labeledElements.has(currentHoveredLabelElement)
  ) {
    const label = currentHoveredLabelElement.__testIdLabel;
    if (label) {
      updateLabelPosition(currentHoveredLabelElement, label);
      try {
        label.showPopover();
      } catch {
        // Ignore
      }
    }
  }
}

// Throttled version
const throttledGlobalMouseMove = throttle(handleGlobalMouseMove, 50);

function manageGlobalHoverListener() {
  if (state.displayMode === "hover") {
    if (!globalHoverListener) {
      // We use mousemove now to handle elements that don't fire mouse events
      // and to allow continuous checking as mouse moves over disabled elements.
      globalHoverListener = throttledGlobalMouseMove as (e: MouseEvent) => void;
      document.addEventListener("mousemove", globalHoverListener, {
        passive: true,
      });
    }
  } else {
    if (globalHoverListener) {
      document.removeEventListener("mousemove", globalHoverListener);
      globalHoverListener = null;
      // Also reset current hovered element and hide its label if visible
      if (
        currentHoveredLabelElement &&
        currentHoveredLabelElement.__testIdLabel
      ) {
        try {
          currentHoveredLabelElement.__testIdLabel.hidePopover();
        } catch {
          // Ignore
        }
      }
      currentHoveredLabelElement = null;
    }
  }
}

export function createLabel(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  const attributeValue = el.getAttribute(state.customAttribute);
  if (!attributeValue) return;

  // Avoid duplicates
  if (extEl.__testIdLabel) return;

  // Create label as a popover
  const label = document.createElement("div");
  label.className = "testid-overlay-label";
  label.innerText = attributeValue;
  label.setAttribute("popover", "manual");

  extEl.__testIdLabel = label;
  labeledElements.add(extEl);

  // Append to body (popover API handles top layer placement)
  document.body.appendChild(label);

  if (state.displayMode === "always") {
    // For always mode, we need to update position initially
    updateLabelPosition(el, label);
  }

  // Apply border if enabled
  updateElementBorder(el);

  // Update visibility on next frame
  requestAnimationFrame(() => {
    updateLabelVisibility(el);
  });
}

// Manually calculate position to be robust against complex layouts/transforms
function updateLabelPosition(target: HTMLElement, label: HTMLElement) {
  const rect = target.getBoundingClientRect();

  // Position above the element
  // The CSS has transform: translateY(-100%) to move it up by its own height
  label.style.top = `${rect.top}px`;
  label.style.left = `${rect.left}px`;
}

export function removeLabel(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  if (!extEl.__testIdLabel) return;

  // Hide popover before removing (clean dismissal)
  try {
    extEl.__testIdLabel.hidePopover();
  } catch {
    // Ignore if already hidden or not shown
  }

  // Remove the label from DOM
  extEl.__testIdLabel.remove();
  delete extEl.__testIdLabel;

  // Clean up anchor name from element (legacy cleanup)
  if (extEl.__anchorName) {
    el.style.removeProperty("anchor-name");
    delete extEl.__anchorName;
  }

  el.classList.remove("testid-border-highlight");

  labeledElements.delete(extEl);
}

export function updateLabelVisibility(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  if (!extEl.__testIdLabel) return;

  const label = extEl.__testIdLabel;

  if (state.displayMode === "off") {
    // Hide the popover
    try {
      label.hidePopover();
    } catch {
      // Ignore if already hidden
    }
  } else if (state.displayMode === "hover") {
    // Hidden by default in hover mode, handled by global listener
    try {
      label.hidePopover();
    } catch {
      // Ignore if already hidden
    }
  } else {
    // "always" mode - show the popover
    try {
      // Update position before showing
      updateLabelPosition(el, label);
      label.showPopover();
    } catch {
      // Ignore if already shown
    }
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

  // Also cleanup global listener
  if (globalHoverListener) {
    document.removeEventListener("mousemove", globalHoverListener);
    globalHoverListener = null;
    currentHoveredLabelElement = null;
  }
}

export function updateAllLabels(): void {
  // Manage global hover listener based on mode
  manageGlobalHoverListener();

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

    if (attributeMissing || removedFromDom) {
      removeLabel(el);
    } else if (modeMismatch) {
      // Mode mismatch logic
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

  // Update positions for always visible labels
  if (state.displayMode === "always") {
    labeledElements.forEach((el) => {
      const extEl = el as ExtendedHTMLElement;
      if (extEl.__testIdLabel) {
        updateLabelPosition(el, extEl.__testIdLabel);
      }
    });
  }
}

// Add scroll listener to update positions in "always" mode
window.addEventListener(
  "scroll",
  () => {
    if (state.displayMode === "always") {
      labeledElements.forEach((el) => {
        const extEl = el as ExtendedHTMLElement;
        if (extEl.__testIdLabel && document.contains(el)) {
          updateLabelPosition(el, extEl.__testIdLabel);
        }
      });
    } else if (state.displayMode === "hover" && currentHoveredLabelElement) {
      if (
        currentHoveredLabelElement.__testIdLabel &&
        document.contains(currentHoveredLabelElement)
      ) {
        updateLabelPosition(
          currentHoveredLabelElement,
          currentHoveredLabelElement.__testIdLabel
        );
      }
    }
  },
  { passive: true, capture: true }
); // Capture to detect scroll in sub-containers
