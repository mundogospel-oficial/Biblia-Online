import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler to catch network/fetch glitches gracefully without breaking app UI
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason &&
    (event.reason.message === "Failed to fetch" ||
      (typeof event.reason.message === "string" && event.reason.message.includes("Failed to fetch")))
  ) {
    console.warn("[Rede] Conexão temporariamente indisponível (Failed to fetch). As ações serão reexecutadas automaticamente.");
    event.preventDefault(); // Prevents runtime error overlay for network blips
  }
});

// PWA: Only register SW in production standalone, never in iframes or preview
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (!isInIframe && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/OneSignalSDKWorker.js", { scope: "/" }).then((reg) => {
      console.log("Service Worker registered successfully:", reg);
    }).catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });
  });
} else if (isInIframe && "serviceWorker" in navigator) {
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
