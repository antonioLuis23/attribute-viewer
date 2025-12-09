import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onDownloadAll: () => void;
  onDownloadFromSelection: () => void;
}

export const LocatorActions: React.FC<Props> = ({
  onDownloadAll,
  onDownloadFromSelection,
}) => {
  return (
    <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-2.5">
      <Button className="w-full" onClick={onDownloadAll}>
        Download All Locators
      </Button>
      <Button className="w-full" onClick={onDownloadFromSelection}>
        Download Locators from Selection
      </Button>
      <p className="text-xs text-muted-foreground leading-[1.4] text-left">
        Press ESC to cancel selection mode
      </p>
    </div>
  );
};
