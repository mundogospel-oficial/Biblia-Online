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
    }).catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });
  });
} else if ((isPreviewHost || isInIframe) && "serviceWorker" in navigator) {
  // Unregister stale SWs in preview safely
  try {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => {}));
      })
      .catch((err) => {
        console.warn("Failed to get SW registrations:", err);
      });
  } catch (err) {
    console.warn("Service Worker API is unavailable or restricted:", err);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
