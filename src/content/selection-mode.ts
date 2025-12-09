// Selection mode functionality for the attribute viewer extension

import type { ExtendedHTMLElement, LocatorData } from "./types";
import { state } from "./state";
import { updateAllBorders, updateLabelVisibility } from "./label-manager";
import { observer, startObserver } from "./observer";

export function startSelectionMode(): void {
  state.selectionMode = true;
  document.body.style.cursor = "crosshair";

  // Create selection overlay
  state.selectionOverlay = document.createElement("div");
  state.selectionOverlay.className = "testid-selection-overlay";
  state.selectionOverlay.style.display = "none";
  document.body.appendChild(state.selectionOverlay);

  // Disconnect observer to prevent infinite loops during selection mode
  observer.disconnect();

  // Temporarily hide all borders and labels
  const elements = document.querySelectorAll<HTMLElement>(
    `[${state.customAttribute}]`
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

export function stopSelectionMode(): void {
  state.selectionMode = false;
  document.body.style.cursor = "";

  // Remove event listeners
  document.removeEventListener("mouseover", handleSelectionHover, true);
  document.removeEventListener("mouseout", handleSelectionMouseOut, true);
  document.removeEventListener("click", handleSelectionClick, true);
  document.removeEventListener("scroll", handleSelectionScroll, true);
  document.removeEventListener("keydown", handleSelectionEscape);

  // Remove selection overlay
  if (state.selectionOverlay) {
    state.selectionOverlay.remove();
    state.selectionOverlay = null;
  }

  // Clear hovered element reference
  state.hoveredElement = null;

  // Restore borders and labels
  updateAllBorders();
  const elements = document.querySelectorAll<HTMLElement>(
    `[${state.customAttribute}]`
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
  if (!state.selectionMode || !state.selectionOverlay) return;

  event.stopPropagation();

  // Update hovered element
  state.hoveredElement = event.target as HTMLElement;

  // Get element bounds
  const rect = state.hoveredElement.getBoundingClientRect();

  // Position and size the overlay to match the element
  state.selectionOverlay.style.display = "block";
  state.selectionOverlay.style.left = `${rect.left}px`;
  state.selectionOverlay.style.top = `${rect.top}px`;
  state.selectionOverlay.style.width = `${rect.width}px`;
  state.selectionOverlay.style.height = `${rect.height}px`;
}

function handleSelectionMouseOut(event: Event): void {
  if (!state.selectionMode) return;
  event.stopPropagation();
}

function handleSelectionScroll(): void {
  if (!state.selectionMode || !state.selectionOverlay || !state.hoveredElement)
    return;

  // Update overlay position when page scrolls
  const rect = state.hoveredElement.getBoundingClientRect();
  state.selectionOverlay.style.left = `${rect.left}px`;
  state.selectionOverlay.style.top = `${rect.top}px`;
  state.selectionOverlay.style.width = `${rect.width}px`;
  state.selectionOverlay.style.height = `${rect.height}px`;
}

function handleSelectionClick(event: Event): void {
  if (!state.selectionMode) return;

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

export function collectLocators(parentElement: HTMLElement): LocatorData[] {
  // Include the parent element itself if it has the custom attribute
  const allElements: HTMLElement[] = [parentElement];

  const childElements = Array.from(
    parentElement.querySelectorAll<HTMLElement>(`[${state.customAttribute}]`)
  );
  allElements.push(...childElements);

  const locators: LocatorData[] = [];

  allElements.forEach((el) => {
    const attributeValue = el.getAttribute(state.customAttribute);

    // Skip if no attribute value
    if (!attributeValue) return;

    const tagName = el.tagName.toLowerCase();
    console.log("tagName", tagName);
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
      locator: `[${state.customAttribute}='${attributeValue}']`,
    });
  });

  return locators;
}

export function downloadLocators(locators: LocatorData[]): void {
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
  if (event.key === "Escape" && state.selectionMode) {
    stopSelectionMode();
  }
}
