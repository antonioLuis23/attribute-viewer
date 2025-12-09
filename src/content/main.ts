// Main entry point for the attribute viewer content script
import "./style.css";

import { loadSettings, listenForSettingsChanges } from "./storage";
import { updateAllLabels } from "./label-manager";
import { startObserver } from "./observer";
import {
  startSelectionMode,
  collectLocators,
  downloadLocators,
} from "./selection-mode";

// Initialize settings
loadSettings();
listenForSettingsChanges();

// Start observing DOM changes
startObserver();

// Initial load
window.addEventListener("load", updateAllLabels);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === "startSelectionMode") {
    startSelectionMode();
  } else if (request.action === "downloadAllLocators") {
    const locators = collectLocators(document.body);
    downloadLocators(locators);
  }
});
