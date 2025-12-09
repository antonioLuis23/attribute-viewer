import React from "react";
import ReactDOM from "react-dom/client";
import { Popup } from "./Popup";
import "./style.css";

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
