import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { createAiApi } from "./engine/ai";
import "./styles.css";

const params = new URLSearchParams(window.location.search);
if (import.meta.env.DEV || params.has("ai")) {
  window.__NOESIS__ = createAiApi();
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root is missing");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
