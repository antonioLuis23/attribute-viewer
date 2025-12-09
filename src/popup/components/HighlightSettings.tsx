import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  showBorders: boolean;
  onChange: (checked: boolean) => void;
}

export const HighlightSettings: React.FC<Props> = ({
  showBorders,
  onChange,
}) => {
  return (
    <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-2.5">
      <label className="flex items-center gap-2.5 text-[13px] text-foreground cursor-pointer select-none">
        <Checkbox
          id="showBorders"
          checked={showBorders}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        <span className="font-medium">
          Highlight elements with the attribute
        </span>
      </label>
    </div>
  );
};
