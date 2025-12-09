import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onDownload: () => void;
}

export const LocatorActions: React.FC<Props> = ({ onDownload }) => {
  return (
    <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-2.5">
      <Button id="downloadLocators" className="w-full" onClick={onDownload}>
        Download Locators from Selection
      </Button>
      <p className="text-xs text-muted-foreground leading-[1.4] text-left">
        Click to select a parent element on the page
      </p>
      <p className="text-xs text-muted-foreground leading-[1.4] text-left">
        Press ESC to cancel selection mode
      </p>
    </div>
  );
};
