import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DisplayMode = "always" | "hover" | "off";

interface Props {
  displayMode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export const DisplaySettings: React.FC<Props> = ({ displayMode, onChange }) => {
  return (
    <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-2.5">
      <label
        htmlFor="displayMode"
        className="text-[13px] font-semibold text-foreground"
      >
        Display Mode:
      </label>
      <Select
        value={displayMode}
        onValueChange={(value) => onChange(value as DisplayMode)}
      >
        <SelectTrigger id="displayMode" className="w-full">
          <SelectValue placeholder="Select display mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="always">Always Show</SelectItem>
          <SelectItem value="hover">On Hover</SelectItem>
          <SelectItem value="off">Off</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
