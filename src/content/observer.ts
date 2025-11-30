// MutationObserver setup for the attribute viewer extension

import { state } from "./state";
import { updateAllLabels } from "./label-manager";

// Observe DOM changes to update labels dynamically
export const observer = new MutationObserver(() => {
  updateAllLabels();
});

// Start observing function (can be called to restart with new attribute)
export function startObserver(): void {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [state.customAttribute],
  });
}
