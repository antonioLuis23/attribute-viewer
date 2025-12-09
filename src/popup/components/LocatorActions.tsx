import React from "react";

interface Props {
  onDownload: () => void;
}

export const LocatorActions: React.FC<Props> = ({ onDownload }) => {
  return (
    <div className="setting-group">
      <button
        id="downloadLocators"
        className="download-button"
        onClick={onDownload}
      >
        Download Locators from Selection
      </button>
      <p className="hint">Click to select a parent element on the page</p>
      <p className="hint">Press ESC to cancel selection mode</p>
    </div>
  );
};
