import React from "react";

export type DisplayMode = "always" | "hover" | "off";

interface Props {
  displayMode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export const DisplaySettings: React.FC<Props> = ({ displayMode, onChange }) => {
  return (
    <div className="setting-group">
      <label htmlFor="displayMode">Display Mode:</label>
      <select
        id="displayMode"
        value={displayMode}
        onChange={(e) => onChange(e.target.value as DisplayMode)}
      >
        <option value="always">Always Show</option>
        <option value="hover">On Hover</option>
        <option value="off">Off</option>
      </select>
    </div>
  );
};
