// Type definitions for the attribute viewer extension

export interface StorageSettings {
  displayMode?: DisplayMode;
  showBorders?: boolean;
  customAttribute?: string;
}

export type DisplayMode = "always" | "hover" | "off";

export interface ExtendedHTMLElement extends HTMLElement {
  __testIdLabel?: HTMLDivElement;
  __anchorName?: string;
  __hoverHandlers?: {
    show: () => void;
    hide: () => void;
  };
}

export interface LocatorData {
  name: string;
  type: string;
  locator: string;
}
