// Label management functions for the attribute viewer extension

import type { ExtendedHTMLElement } from "./types";
import {
  state,
  labeledElements,
  repositionScheduled,
  setRepositionScheduled,
} from "./state";
import { getComputedZIndex, insertLabelForElement } from "./dom-utils";

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

  // Insert label as sibling to inherit stacking context
  insertLabelForElement(label, el);

  // Set up hover listeners ONLY for hover mode
  if (state.displayMode === "hover") {
    // Store the event handlers so we can remove them later if mode changes
    const showHandler = (): void => {
      label.style.visibility = "visible";
    };
    const hideHandler = (): void => {
      label.style.visibility = "hidden";
    };

    // For disabled buttons/elements with pointer-events: none, wrap them
    const isDisabled =
      (el as HTMLButtonElement | HTMLInputElement).disabled ||
      el.hasAttribute("disabled") ||
      window.getComputedStyle(el).pointerEvents === "none";

    let hoverTarget: HTMLElement = el;

    if (isDisabled) {
      // Create a wrapper that will receive hover events
      const wrapper = document.createElement("div");
      wrapper.className = "testid-hover-wrapper";
      wrapper.style.display = "inline-block";
      wrapper.style.position = "relative";

      // Insert wrapper before element
      if (el.parentNode) {
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);

        // Store wrapper reference for cleanup
        extEl.__hoverWrapper = wrapper;
        hoverTarget = wrapper;
      }
    }

    // Add event listeners to the appropriate target
    extEl.__hoverHandlers = { show: showHandler, hide: hideHandler };
    hoverTarget.addEventListener("mouseenter", showHandler);
    hoverTarget.addEventListener("mouseleave", hideHandler);
  }

  // Apply border if enabled
  updateElementBorder(el);

  // Use requestAnimationFrame to ensure dimensions are calculated
  requestAnimationFrame(() => {
    positionLabel(el);
    updateLabelVisibility(el);
  });
}

export function removeLabel(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  if (!extEl.__testIdLabel) return;

  if (extEl.__hoverHandlers) {
    const hoverTarget = extEl.__hoverWrapper || el;
    hoverTarget.removeEventListener("mouseenter", extEl.__hoverHandlers.show);
    hoverTarget.removeEventListener("mouseleave", extEl.__hoverHandlers.hide);
    delete extEl.__hoverHandlers;
  }

  if (extEl.__hoverWrapper) {
    const wrapper = extEl.__hoverWrapper;
    const parent = wrapper.parentNode;
    if (parent) {
      parent.insertBefore(el, wrapper);
      wrapper.remove();
    }
    delete extEl.__hoverWrapper;
  }

  extEl.__testIdLabel.remove();
  delete extEl.__testIdLabel;

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

export function positionLabel(el: HTMLElement, retryCount = 0): void {
  const extEl = el as ExtendedHTMLElement;
  if (!extEl.__testIdLabel) return;

  const rect = el.getBoundingClientRect();
  const label = extEl.__testIdLabel;

  // Get label dimensions - if they're 0, try again later
  const labelWidth = label.offsetWidth;
  const labelHeight = label.offsetHeight;

  if (labelWidth === 0 || labelHeight === 0) {
    // Dimensions not ready yet, schedule for next frame
    requestAnimationFrame(() => positionLabel(el, retryCount));
    return;
  }

  // Check if element position has stabilized (for animations)
  const currentPos = { left: rect.left, top: rect.top };

  if (!extEl.__lastPosition) {
    // First position check - save and wait
    extEl.__lastPosition = currentPos;
    setTimeout(() => positionLabel(el, retryCount + 1), 50);
    return;
  }

  // Compare with previous position
  const posChanged =
    Math.abs(currentPos.left - extEl.__lastPosition.left) > 1 ||
    Math.abs(currentPos.top - extEl.__lastPosition.top) > 1;

  if (posChanged && retryCount < 20) {
    // Position still changing (animation in progress), wait and retry
    extEl.__lastPosition = currentPos;
    setTimeout(() => positionLabel(el, retryCount + 1), 50);
    return;
  }

  // Position has stabilized, set final position
  delete extEl.__lastPosition;

  // Use the exact position from the element's bounding rect (same as border)
  let left = rect.left;
  const top = rect.top - labelHeight;

  // Prevent label from going off-screen horizontally
  const viewportWidth = window.innerWidth;

  // If label would go off right edge, adjust it
  if (left + labelWidth > viewportWidth) {
    left = viewportWidth - labelWidth;
  }

  // If label would go off left edge, adjust it
  if (left < 0) {
    left = 0;
  }

  label.style.left = left + "px";
  label.style.top = top + "px";
}

export function scheduleReposition(): void {
  if (!repositionScheduled) {
    setRepositionScheduled(true);
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>(`[${state.customAttribute}]`)
        .forEach(positionLabel);
      setRepositionScheduled(false);
    });
  }
}
