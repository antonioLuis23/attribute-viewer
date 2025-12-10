// Main entry point for the attribute viewer content script
import "./style.css";

import { loadSettings, listenForSettingsChanges } from "./storage";
import {
  updateAllLabels,
  getAttributeReport,
  showDuplicateLabels,
  hideDuplicateLabels,
} from "./label-manager";
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
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "startSelectionMode") {
    startSelectionMode();
  } else if (request.action === "downloadAllLocators") {
    const locators = collectLocators(document.body);
    downloadLocators(locators);
  } else if (request.action === "getAttributeReport") {
    const report = getAttributeReport();
    sendResponse(report);
    return true; // Keep channel open for async response
  } else if (request.action === "showDuplicates") {
    showDuplicateLabels(request.attributeValue);
  } else if (request.action === "hideDuplicates") {
    hideDuplicateLabels();
  }
});
