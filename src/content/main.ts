// Main entry point for the attribute viewer content script
import "./style.css";

import { loadSettings, listenForSettingsChanges } from "./storage";
import { updateAllLabels, scheduleReposition } from "./label-manager";
import { startObserver } from "./observer";
import { startSelectionMode } from "./selection-mode";

// Initialize settings
loadSettings();
listenForSettingsChanges();

// Start observing DOM changes
startObserver();

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
