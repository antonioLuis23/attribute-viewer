// Import CSS
import "./style.css";

// Popup script for Locator Overlay extension

type DisplayMode = "always" | "hover" | "off";

interface StorageSettings {
  displayMode?: DisplayMode;
  showBorders?: boolean;
  customAttribute?: string;
}

// Get references to DOM elements
const displayModeSelect = document.getElementById(
  "displayMode"
) as HTMLSelectElement;
const showBordersCheckbox = document.getElementById(
  "showBorders"
) as HTMLInputElement;
const customAttributeInput = document.getElementById(
  "customAttribute"
) as HTMLInputElement;
const applyAttributeButton = document.getElementById(
  "applyAttribute"
) as HTMLButtonElement;
const downloadLocatorsButton = document.getElementById(
  "downloadLocators"
) as HTMLButtonElement;

// Load current settings
chrome.storage.sync.get(
  ["displayMode", "showBorders", "customAttribute"],
  (result: StorageSettings) => {
    if (result.displayMode) {
      displayModeSelect.value = result.displayMode;
    }
    if (result.showBorders !== undefined) {
      showBordersCheckbox.checked = result.showBorders;
    }
    if (result.customAttribute) {
      customAttributeInput.value = result.customAttribute;
    }
  }
);

// Save display mode changes immediately
displayModeSelect.addEventListener("change", () => {
  const displayMode = displayModeSelect.value as DisplayMode;
  chrome.storage.sync.set({ displayMode });
});

// Save border setting changes immediately
showBordersCheckbox.addEventListener("change", () => {
  const showBorders = showBordersCheckbox.checked;
  chrome.storage.sync.set({ showBorders });
});

// Apply custom attribute when button is clicked
applyAttributeButton.addEventListener("click", () => {
  const customAttribute = customAttributeInput.value.trim();
  if (customAttribute) {
    chrome.storage.sync.set({ customAttribute }, () => {
      // Visual feedback
      applyAttributeButton.textContent = "Applied!";
      setTimeout(() => {
        applyAttributeButton.textContent = "Apply";
      }, 1500);
    });
  }
});

// Handle Enter key in custom attribute input
customAttributeInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    applyAttributeButton.click();
  }
});

// Download locators button
downloadLocatorsButton.addEventListener("click", async () => {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.id) {
      // Send message to content script to start selection mode
      chrome.tabs.sendMessage(tab.id, { action: "startSelectionMode" });

      // Close the popup so user can interact with the page
      window.close();
    }
  } catch (error) {
    console.error("Error starting selection mode:", error);
  }
});
