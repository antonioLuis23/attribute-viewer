// Import CSS for content script
import "./style.css";

// Type definitions
interface StorageSettings {
  displayMode?: DisplayMode;
  showBorders?: boolean;
  customAttribute?: string;
}

type DisplayMode = "always" | "hover" | "off";

interface ExtendedHTMLElement extends HTMLElement {
  __testIdLabel?: HTMLDivElement;
  __hoverHandlers?: {
    show: () => void;
    hide: () => void;
  };
  __hoverWrapper?: HTMLDivElement;
  __lastPosition?: {
    left: number;
    top: number;
  };
}

const labeledElements = new Set<ExtendedHTMLElement>();
const TABLE_WRAPPER_CLASS = "testid-table-wrapper";

interface LocatorData {
  name: string;
  type: string;
  locator: string;
}

// Current display mode
let displayMode: DisplayMode = "hover";
let showBorders = true;
let selectionMode = false;
let hoveredElement: HTMLElement | null = null;
let customAttribute = "data-testid";
let selectionOverlay: HTMLDivElement | null = null;

// Load settings from storage
chrome.storage.sync.get(
  ["displayMode", "showBorders", "customAttribute"],
  (result: StorageSettings) => {
    displayMode = result.displayMode || "hover";
    showBorders = result.showBorders !== undefined ? result.showBorders : true;
    customAttribute = result.customAttribute || "data-testid";
    updateAllLabels();
  }
);

// Listen for setting changes from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    if (changes.displayMode) {
      displayMode = changes.displayMode.newValue as DisplayMode;
      updateAllLabels();
    }
    if (changes.showBorders !== undefined) {
      showBorders = changes.showBorders.newValue as boolean;
      updateAllBorders();
    }
    if (changes.customAttribute) {
      customAttribute = changes.customAttribute.newValue as string;
      // Need to recreate observer with new attribute
      observer.disconnect();
      cleanupAllLabels();
      updateAllLabels();
      updateAllBorders();
      startObserver();
    }
  }
});

function getComputedZIndex(el: HTMLElement): number {
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

function ensureTableWrapper(table: HTMLTableElement): HTMLDivElement {
  const currentParent = table.parentElement;
  if (currentParent && currentParent.classList.contains(TABLE_WRAPPER_CLASS)) {
    return currentParent as HTMLDivElement;
  }

  const wrapper = document.createElement("div");
  wrapper.className = TABLE_WRAPPER_CLASS;

  const parentNode = table.parentNode;
  if (parentNode) {
    parentNode.insertBefore(wrapper, table);
  } else {
    document.body.appendChild(wrapper);
  }

  wrapper.appendChild(table);
  return wrapper;
}

function insertLabelForElement(label: HTMLDivElement, el: HTMLElement): void {
  const tableAncestor = el.closest("table");
  if (tableAncestor instanceof HTMLTableElement) {
    const wrapper = ensureTableWrapper(tableAncestor);
    wrapper.insertBefore(label, tableAncestor);
    return;
  }

  if (el.parentNode) {
    el.parentNode.insertBefore(label, el);
  } else {
    document.body.appendChild(label);
  }
}

function createLabel(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  const attributeValue = el.getAttribute(customAttribute);
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
  if (displayMode === "hover") {
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

function removeLabel(el: HTMLElement): void {
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

function updateLabelVisibility(el: HTMLElement): void {
  const extEl = el as ExtendedHTMLElement;
  if (!extEl.__testIdLabel) return;

  const label = extEl.__testIdLabel;

  if (displayMode === "off") {
    label.style.display = "none";
  } else if (displayMode === "hover") {
    // Use visibility instead of display so dimensions are always available
    label.style.display = "block";
    label.style.visibility = "hidden"; // Hidden by default, shown on hover
  } else {
    // always mode
    label.style.display = "block";
    label.style.visibility = "visible";
  }
}

function updateElementBorder(el: HTMLElement): void {
  if (showBorders) {
    el.classList.add("testid-border-highlight");
  } else {
    el.classList.remove("testid-border-highlight");
  }
}

function updateAllBorders(): void {
  const elements = document.querySelectorAll<HTMLElement>(
    `[${customAttribute}]`
  );
  elements.forEach(updateElementBorder);
}

function cleanupAllLabels(): void {
  labeledElements.forEach((el) => {
    removeLabel(el);
  });
  labeledElements.clear();
}

function updateAllLabels(): void {
  labeledElements.forEach((el) => {
    const extEl = el as ExtendedHTMLElement;
    const label = extEl.__testIdLabel;
    const modeMismatch = label && (label as any).__mode !== displayMode;
    const attributeMissing = !el.hasAttribute(customAttribute);
    const removedFromDom = !document.contains(el);

    if (modeMismatch || attributeMissing || removedFromDom) {
      removeLabel(el);
    }
  });

  const elements = document.querySelectorAll<HTMLElement>(
    `[${customAttribute}]`
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
      (extEl.__testIdLabel as any).__mode = displayMode;
    }
  });
}

function positionLabel(el: HTMLElement, retryCount = 0): void {
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

// Observe DOM changes to update labels dynamically
const observer = new MutationObserver(() => {
  updateAllLabels();
});

// Start observing function (can be called to restart with new attribute)
function startObserver(): void {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [customAttribute],
  });
}

// Start observing
startObserver();

// Performance optimization: use requestAnimationFrame for repositioning
let repositionScheduled = false;

function scheduleReposition(): void {
  if (!repositionScheduled) {
    repositionScheduled = true;
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>(`[${customAttribute}]`)
        .forEach(positionLabel);
      repositionScheduled = false;
    });
  }
}

// Initial load
window.addEventListener("load", updateAllLabels);

// Handle scroll events (including in nested scrollable containers)
window.addEventListener("scroll", scheduleReposition, true); // Use capture phase

// Handle resize events
window.addEventListener("resize", scheduleReposition);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === "startSelectionMode") {
    startSelectionMode();
  }
});

// Selection mode functions
function startSelectionMode(): void {
  selectionMode = true;
  document.body.style.cursor = "crosshair";

  // Create selection overlay
  selectionOverlay = document.createElement("div");
  selectionOverlay.className = "testid-selection-overlay";
  selectionOverlay.style.display = "none";
  document.body.appendChild(selectionOverlay);

  // Disconnect observer to prevent infinite loops during selection mode
  observer.disconnect();

  // Temporarily hide all borders and labels
  const elements = document.querySelectorAll<HTMLElement>(
    `[${customAttribute}]`
  );
  elements.forEach((el) => {
    const extEl = el as ExtendedHTMLElement;
    el.classList.remove("testid-border-highlight");
    if (extEl.__testIdLabel) {
      extEl.__testIdLabel.style.display = "none";
    }
  });

  // Add event listeners for hover and click
  document.addEventListener("mouseover", handleSelectionHover, true);
  document.addEventListener("mouseout", handleSelectionMouseOut, true);
  document.addEventListener("click", handleSelectionClick, true);
  document.addEventListener("scroll", handleSelectionScroll, true);

  // Add ESC key handler
  document.addEventListener("keydown", handleSelectionEscape);
}

function stopSelectionMode(): void {
  selectionMode = false;
  document.body.style.cursor = "";

  // Remove event listeners
  document.removeEventListener("mouseover", handleSelectionHover, true);
  document.removeEventListener("mouseout", handleSelectionMouseOut, true);
  document.removeEventListener("click", handleSelectionClick, true);
  document.removeEventListener("scroll", handleSelectionScroll, true);
  document.removeEventListener("keydown", handleSelectionEscape);

  // Remove selection overlay
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }

  // Clear hovered element reference
  hoveredElement = null;

  // Restore borders and labels
  updateAllBorders();
  const elements = document.querySelectorAll<HTMLElement>(
    `[${customAttribute}]`
  );
  elements.forEach((el) => {
    const extEl = el as ExtendedHTMLElement;
    if (extEl.__testIdLabel) {
      updateLabelVisibility(el);
    }
  });

  // Reconnect observer
  startObserver();
}

function handleSelectionHover(event: Event): void {
  if (!selectionMode || !selectionOverlay) return;

  event.stopPropagation();

  // Update hovered element
  hoveredElement = event.target as HTMLElement;

  // Get element bounds
  const rect = hoveredElement.getBoundingClientRect();

  // Position and size the overlay to match the element
  selectionOverlay.style.display = "block";
  selectionOverlay.style.left = `${rect.left}px`;
  selectionOverlay.style.top = `${rect.top}px`;
  selectionOverlay.style.width = `${rect.width}px`;
  selectionOverlay.style.height = `${rect.height}px`;
}

function handleSelectionMouseOut(event: Event): void {
  if (!selectionMode) return;
  event.stopPropagation();
}

function handleSelectionScroll(): void {
  if (!selectionMode || !selectionOverlay || !hoveredElement) return;

  // Update overlay position when page scrolls
  const rect = hoveredElement.getBoundingClientRect();
  selectionOverlay.style.left = `${rect.left}px`;
  selectionOverlay.style.top = `${rect.top}px`;
  selectionOverlay.style.width = `${rect.width}px`;
  selectionOverlay.style.height = `${rect.height}px`;
}

function handleSelectionClick(event: Event): void {
  if (!selectionMode) return;

  event.preventDefault();
  event.stopPropagation();

  const parentElement = event.target as HTMLElement;

  // Stop selection mode FIRST to remove event listeners
  // This prevents the download link click from triggering this handler again
  stopSelectionMode();

  // Collect all locators within this element
  const locators = collectLocators(parentElement);

  // Download as JSON
  downloadLocators(locators);
}

function collectLocators(parentElement: HTMLElement): LocatorData[] {
  // Include the parent element itself if it has the custom attribute
  const allElements: HTMLElement[] = [parentElement];
  console.log("parentElement", parentElement);
  console.log("allElements", allElements);
  const childElements = Array.from(
    parentElement.querySelectorAll<HTMLElement>(`[${customAttribute}]`)
  );
  console.log("childElements", childElements);
  allElements.push(...childElements);

  const locators: LocatorData[] = [];

  allElements.forEach((el) => {
    const attributeValue = el.getAttribute(customAttribute);

    // Skip if no attribute value
    if (!attributeValue) return;

    const tagName = el.tagName.toLowerCase();

    // Determine type based on tag name
    let type = "element";
    if (tagName === "section" || el.getAttribute("role") === "region") {
      type = "section";
    } else if (tagName === "button" || el.getAttribute("role") === "button") {
      type = "button";
    } else if (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select"
    ) {
      type = "field";
    } else if (tagName === "a" || el.getAttribute("role") === "link") {
      type = "link";
    } else if (tagName === "nav") {
      type = "navigation";
    } else if (tagName === "form") {
      type = "form";
    } else if (
      (tagName.match(/^h[1-6]$/) ||
        tagName === "p" ||
        tagName === "label" ||
        tagName === "span") &&
      el.textContent?.trim()
    ) {
      type = "label";
    } else if (tagName === "div") {
      type = "container";
    }

    locators.push({
      name: attributeValue
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      type: type,
      locator: `[${customAttribute}='${attributeValue}']`,
    });
  });

  return locators;
}

function downloadLocators(locators: LocatorData[]): void {
  // Log for debugging
  console.log("Downloading locators:", locators);

  const json = JSON.stringify(locators, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `locators-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleSelectionEscape(event: KeyboardEvent): void {
  if (event.key === "Escape" && selectionMode) {
    stopSelectionMode();
  }
}
