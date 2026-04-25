import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: Only register SW in production standalone, never in iframes or preview
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (!isInIframe && !isPreviewHost && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Notify SW that app opened
      reg.active?.postMessage({ type: "APP_OPENED" });
    }).catch(() => {});
  });
} else if (isPreviewHost || isInIframe) {
  // Unregister stale SWs in preview
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
