import React from "react";
import { ScanEye } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <div className="flex items-center gap-2.5">
      <ScanEye className="w-6 h-6 text-foreground" />
      <h1 className="text-xl font-medium tracking-wide text-foreground">
        Attribute Viewer
      </h1>
    </div>
  );
};
