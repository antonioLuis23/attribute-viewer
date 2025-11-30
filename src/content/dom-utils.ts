// DOM utility functions for the attribute viewer extension

import { TABLE_WRAPPER_CLASS } from "./state";

export function getComputedZIndex(el: HTMLElement): number {
  let current: HTMLElement | null = el;
  let maxZIndex = 0;

  while (current && current !== document.body) {
    const computed = window.getComputedStyle(current);
    const zIndex = computed.zIndex;

    if (zIndex !== "auto") {
      const numericZIndex = parseInt(zIndex, 10);
      if (!isNaN(numericZIndex)) {
        maxZIndex = Math.max(maxZIndex, numericZIndex);
      }
    }

    current = current.parentElement;
  }

  return maxZIndex;
}

export function ensureTableWrapper(table: HTMLTableElement): HTMLDivElement {
  const currentParent = table.parentElement;
  if (currentParent && currentParent.classList.contains(TABLE_WRAPPER_CLASS)) {
    return currentParent as HTMLDivElement;
  }

  const wrapper = document.createElement("div");
  wrapper.className = TABLE_WRAPPER_CLASS;

  const parentNode = table.parentNode;
  if (parentNode) {
    parentNode.insertBefore(wrapper, table);
  } else {
    document.body.appendChild(wrapper);
  }

  wrapper.appendChild(table);
  return wrapper;
}

export function insertLabelForElement(
  label: HTMLDivElement,
  el: HTMLElement
): void {
  const tableAncestor = el.closest("table");
  if (tableAncestor instanceof HTMLTableElement) {
    const wrapper = ensureTableWrapper(tableAncestor);
    wrapper.insertBefore(label, tableAncestor);
    return;
  }

  if (el.parentNode) {
    el.parentNode.insertBefore(label, el);
  } else {
    document.body.appendChild(label);
  }
}
