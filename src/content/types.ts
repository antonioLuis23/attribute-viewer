// Type definitions for the attribute viewer extension

export interface StorageSettings {
  displayMode?: DisplayMode;
  showBorders?: boolean;
  customAttribute?: string;
}

export type DisplayMode = "always" | "hover" | "off";

export interface ExtendedHTMLElement extends HTMLElement {
  __testIdLabel?: HTMLDivElement;
  __hoverHandlers?: {
    show: () => void;
    hide: () => void;
  };
  __hoverWrapper?: HTMLDivElement;
  __lastPosition?: {
    left: number;
    top: number;
  };
}

export interface LocatorData {
  name: string;
  type: string;
  locator: string;
}
