// Label management functions for the attribute viewer extension

import type { ExtendedHTMLElement } from "./types";
import { state, labeledElements } from "./state";
import {
  getComputedZIndex,
  setupElementForLabel,
  insertLabelInElement,
  cleanupElementPosition,
} from "./dom-utils";

export function createLabel(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  const attributeValue = el.getAttribute(state.customAttribute);
  if (!attributeValue) return;

  // Avoid duplicates
  if (extEl.__testIdLabel) return;

  // Set up element for label positioning (adds position:relative if needed)
  setupElementForLabel(el);

  const label = document.createElement("div");
  label.className = "testid-overlay-label";
  label.innerText = attributeValue;

  extEl.__testIdLabel = label;
  labeledElements.add(extEl);

  // Calculate and set z-index based on parent element
  const parentZIndex = getComputedZIndex(el);
  label.style.zIndex = String(parentZIndex + 1);

  // Insert label as first child of the element
  insertLabelInElement(label, el);

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

  if (extEl.__hoverHandlers) {
    el.removeEventListener("mouseenter", extEl.__hoverHandlers.show);
    el.removeEventListener("mouseleave", extEl.__hoverHandlers.hide);
    delete extEl.__hoverHandlers;
  }

  // Remove the label
  extEl.__testIdLabel.remove();
  delete extEl.__testIdLabel;

  // Restore original position style
  cleanupElementPosition(el);

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
}

export function updateAllLabels(): void {
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
