import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { AttributeSettings } from "./components/AttributeSettings";
import { DisplaySettings, DisplayMode } from "./components/DisplaySettings";
import { HighlightSettings } from "./components/HighlightSettings";
import { LocatorActions } from "./components/LocatorActions";
import { ReportSection } from "./components/ReportSection";

interface StorageSettings {
  displayMode?: DisplayMode;
  showBorders?: boolean;
  customAttribute?: string;
}

export const Popup: React.FC = () => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("hover");
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [customAttribute, setCustomAttribute] = useState<string>("data-testid");
  const [buttonText, setButtonText] = useState<string>("Apply");

  useEffect(() => {
    // Load current settings
    chrome.storage.sync.get(
      ["displayMode", "showBorders", "customAttribute"],
      (result) => {
        const settings = result as StorageSettings;
        if (settings.displayMode) setDisplayMode(settings.displayMode);
        if (settings.showBorders !== undefined)
          setShowBorders(settings.showBorders);
        if (settings.customAttribute)
          setCustomAttribute(settings.customAttribute);
      }
    );
  }, []);

  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    chrome.storage.sync.set({ displayMode: mode });
  };

  const handleShowBordersChange = (checked: boolean) => {
    setShowBorders(checked);
    chrome.storage.sync.set({ showBorders: checked });
  };

  const handleApplyAttribute = () => {
    const trimmedAttribute = customAttribute.trim();
    if (trimmedAttribute) {
      chrome.storage.sync.set({ customAttribute: trimmedAttribute }, () => {
        setButtonText("Applied!");
        setTimeout(() => {
          setButtonText("Apply");
        }, 1500);
      });
    }
  };

  const handleDownloadFromSelection = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "startSelectionMode" });
        window.close();
      }
    } catch (error) {
      console.error("Error starting selection mode:", error);
    }
  };

  const handleDownloadAllLocators = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "downloadAllLocators" });
      }
    } catch (error) {
      console.error("Error downloading all locators:", error);
    }
  };

  return (
    <div className="flex flex-col gap-[18px] p-3">
      <Header />
      <AttributeSettings
        attribute={customAttribute}
        onAttributeChange={setCustomAttribute}
        onApply={handleApplyAttribute}
        buttonText={buttonText}
      />
      <DisplaySettings
        displayMode={displayMode}
        onChange={handleDisplayModeChange}
      />
      <HighlightSettings
        showBorders={showBorders}
        onChange={handleShowBordersChange}
      />
      <ReportSection attribute={customAttribute} />
      <LocatorActions
        onDownloadAll={handleDownloadAllLocators}
        onDownloadFromSelection={handleDownloadFromSelection}
      />
    </div>
  );
};
