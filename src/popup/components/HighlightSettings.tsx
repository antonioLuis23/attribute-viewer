import React from "react";

interface Props {
  showBorders: boolean;
  onChange: (checked: boolean) => void;
}

export const HighlightSettings: React.FC<Props> = ({
  showBorders,
  onChange,
}) => {
  return (
    <div className="setting-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          id="showBorders"
          checked={showBorders}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>Highlight elements with the attribute</span>
      </label>
    </div>
  );
};
