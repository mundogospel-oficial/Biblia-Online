import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Soften console.error for transient network glitches
const originalConsoleError = console.error.bind(console);
console.error = (...args: any[]) => {
  const text = args.map(a => (a?.message || a?.stack || String(a || ''))).join(' ');
  if (
    text.includes('Failed to fetch') ||
    text.includes('NetworkError') ||
    text.includes('fetch failed') ||
    text.includes('Load failed')
  ) {
    console.warn('[Rede] Falha transitória de conexão interceptada com segurança:', ...args);
    return;
  }
  originalConsoleError(...args);
};

// Global error handler to catch network/fetch glitches and LockManager timeouts gracefully without breaking app UI
window.addEventListener("unhandledrejection", (event) => {
  const reasonStr = event.reason
    ? (typeof event.reason === "string"
        ? event.reason
        : event.reason.message || String(event.reason) || "")
    : "";

  if (
    reasonStr.includes("Failed to fetch") ||
    reasonStr.includes("NetworkError") ||
    reasonStr.includes("Load failed") ||
    reasonStr.includes("fetch failed") ||
    reasonStr.includes("LockManager") ||
    reasonStr.includes("NavigatorLock") ||
    reasonStr.includes("lock:sb-") ||
    (reasonStr.includes("lock") && reasonStr.includes("timed out waiting"))
  ) {
    console.warn("[Sistema] Exceção assíncrona interceptada com segurança:", reasonStr);
    event.preventDefault(); // Prevents runtime error overlay for network blips / lock timeouts
  }
});

window.addEventListener("error", (event) => {
  const msg = event.message || "";
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed") ||
    msg.includes("fetch failed") ||
    msg.includes("Script error") ||
    msg.includes("LockManager") ||
    msg.includes("NavigatorLock") ||
    msg.includes("lock:sb-") ||
    (msg.includes("lock") && msg.includes("timed out waiting"))
  ) {
    console.warn("[Sistema] Erro global interceptado com segurança:", msg);
    event.preventDefault();
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
