# Attribute Viewer

A Chrome extension built with Vite + CRXJS that highlights DOM elements carrying a specific attribute (defaults to `data-testid`). The popup UI lets you customize the attribute name, toggle different display modes, and download a JSON list of the locators discovered inside a selected region of the page.

## Features
- Highlight and label every element that exposes the configured attribute.
- Toggle label visibility (`always`, `hover`, `off`) and optional border outlines.
- Target any attribute name the page uses (e.g., `data-test`, `aria-label`).
- Enter selection mode from the popup, click a parent element, and export the locators found inside it as JSON.

## Prerequisites
- Node.js 18+ (matches Vite’s current recommendation).
- npm (bundled with Node) or another package manager if you prefer adapting the scripts.

## Installation
```bash
npm install
```

## Development Workflow
The dev server compiles the extension into `dist/` so it can be loaded directly in Chrome.

1. Start the watcher:
   ```bash
   npm run dev
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `dist/` directory.
5. Chrome will reload the extension whenever the dev server rebuilds. If assets stop updating, hit the refresh icon on the extension card.

For more background, see the [CRXJS Loading guide](https://crxjs.dev/guide/loading).

## Building for Release
```bash
npm run build
```
The production-ready bundle is emitted to `dist/`. You can zip that folder (see `release/` for an example) and submit it to the Chrome Web Store or side-load it the same way as in development.

## Using the Extension
1. Open the popup from the Chrome toolbar.
2. (Optional) change the attribute name and click **Apply**.
3. Choose a display mode and whether borders should be drawn.
4. Click **Download Locators**. The popup closes, and the page enters selection mode.
5. Hover over any region to preview the selection overlay, then click to capture it. The extension downloads a JSON file containing the locator objects (name, type, and CSS selector) for every matching element inside the selection.
6. Press `Esc` at any time to exit selection mode without exporting.

### Locator Output
Each locator entry includes:
- `name`: a readable label derived from the attribute value (underscores converted to spaces/title case).
- `type`: best-effort categorization (button, field, link, section, etc.).
- `locator`: the exact attribute selector (e.g., `[data-testid='submit-button']`).

These objects are ready to drop into automated test suites or QA documentation.

