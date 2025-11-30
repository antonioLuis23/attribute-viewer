// Shared state and constants for the attribute viewer extension

import type { DisplayMode, ExtendedHTMLElement } from "./types";

// Mutable state object
export const state = {
  displayMode: "hover" as DisplayMode,
  showBorders: true,
  selectionMode: false,
  hoveredElement: null as HTMLElement | null,
  customAttribute: "data-testid",
  selectionOverlay: null as HTMLDivElement | null,
};

// Set to track labeled elements
export const labeledElements = new Set<ExtendedHTMLElement>();
