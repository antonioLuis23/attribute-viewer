// Label management functions for the attribute viewer extension
// Uses Popover API for z-index + JS Positioning for reliability

import type { ExtendedHTMLElement } from "./types";
import { state, labeledElements } from "./state";

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

  // Set up hover listeners ONLY for hover mode
  if (state.displayMode === "hover") {
    const showHandler = (): void => {
      updateLabelPosition(el, label);
      label.showPopover();
    };
    const hideHandler = (): void => {
      label.hidePopover();
    };

    // Add event listeners to the element
    extEl.__hoverHandlers = { show: showHandler, hide: hideHandler };
    el.addEventListener("mouseenter", showHandler);
    el.addEventListener("mouseleave", hideHandler);
  } else if (state.displayMode === "always") {
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

  // Remove hover handlers
  if (extEl.__hoverHandlers) {
    el.removeEventListener("mouseenter", extEl.__hoverHandlers.show);
    el.removeEventListener("mouseleave", extEl.__hoverHandlers.hide);
    delete extEl.__hoverHandlers;
  }

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
    // Hidden by default in hover mode, shown on mouseenter
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
    }
  },
  { passive: true, capture: true }
); // Capture to detect scroll in sub-containers
