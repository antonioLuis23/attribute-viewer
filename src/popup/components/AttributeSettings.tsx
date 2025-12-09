import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-2.5">
      <label
        htmlFor="customAttribute"
        className="text-[13px] font-semibold text-foreground"
      >
        Attribute Name:
      </label>
      <div className="flex items-center gap-2.5">
        <Input
          type="text"
          id="customAttribute"
          placeholder="data-testid"
          className="flex-1 w-full p-[10px_12px] text-[13px] font-medium text-foreground bg-background border border-input rounded-md transition-colors duration-200 hover:border-ring focus:outline-none focus:border-ring focus:ring-0"
          value={attribute}
          onChange={(e) => onAttributeChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button id="applyAttribute" size="sm" onClick={onApply}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};
