// Chrome storage operations for the attribute viewer extension

import type { StorageSettings, DisplayMode } from "./types";
import { state } from "./state";
import {
  updateAllLabels,
  updateAllBorders,
  cleanupAllLabels,
} from "./label-manager";
import { observer, startObserver } from "./observer";

// Load settings from storage
export function loadSettings(): void {
  chrome.storage.sync.get(
    ["displayMode", "showBorders", "customAttribute"],
    (result: StorageSettings) => {
      state.displayMode = result.displayMode || "hover";
      state.showBorders =
        result.showBorders !== undefined ? result.showBorders : true;
      state.customAttribute = result.customAttribute || "data-testid";
      updateAllLabels();
    }
  );
}

// Listen for setting changes from popup
export function listenForSettingsChanges(): void {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync") {
      if (changes.displayMode) {
        state.displayMode = changes.displayMode.newValue as DisplayMode;
        updateAllLabels();
      }
      if (changes.showBorders !== undefined) {
        state.showBorders = changes.showBorders.newValue as boolean;
        updateAllBorders();
      }
      if (changes.customAttribute) {
        state.customAttribute = changes.customAttribute.newValue as string;
        // Need to recreate observer with new attribute
        observer.disconnect();
        cleanupAllLabels();
        updateAllLabels();
        updateAllBorders();
        startObserver();
      }
    }
  });
}
