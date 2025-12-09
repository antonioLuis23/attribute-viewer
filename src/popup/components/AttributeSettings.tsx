import React from "react";

interface Props {
  attribute: string;
  onAttributeChange: (value: string) => void;
  onApply: () => void;
  buttonText: string;
}

export const AttributeSettings: React.FC<Props> = ({
  attribute,
  onAttributeChange,
  onApply,
  buttonText,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onApply();
    }
  };

  return (
    <div className="setting-group">
      <label htmlFor="customAttribute">Attribute Name:</label>
      <div className="attribute-input-row">
        <input
          type="text"
          id="customAttribute"
          placeholder="data-testid"
          value={attribute}
          onChange={(e) => onAttributeChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button id="applyAttribute" className="apply-button" onClick={onApply}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};
