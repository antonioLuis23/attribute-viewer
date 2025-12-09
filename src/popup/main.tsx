import React from "react";
import ReactDOM from "react-dom/client";
import { Popup } from "./Popup";
import "./style.css";

// Detect system dark mode preference and apply it
const applyTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle("dark", isDark);
};

const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
applyTheme(darkModeQuery.matches);

// Listen for changes in system preference
darkModeQuery.addEventListener("change", (e) => applyTheme(e.matches));

console.log("Popup script executing...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found");
} else {
  console.log("Root element found, mounting React app...");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
