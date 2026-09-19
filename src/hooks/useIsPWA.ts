import { useState, useEffect } from "react";

/**
 * Hook para detectar se o aplicativo está rodando em modo PWA instalado (Standalone)
 * Retorna true apenas se instalado na tela inicial ou executando como aplicativo PWA.
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidApp = typeof document !== "undefined" && document.referrer.includes("android-app://");
    return Boolean(isStandalone || isIOSStandalone || isAndroidApp);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updatePWAStatus = () => {
      const isStandalone = mediaQuery.matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isAndroidApp = typeof document !== "undefined" && document.referrer.includes("android-app://");
      setIsPWA(Boolean(isStandalone || isIOSStandalone || isAndroidApp));
    };

    updatePWAStatus();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updatePWAStatus);
      return () => mediaQuery.removeEventListener("change", updatePWAStatus);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(updatePWAStatus);
      return () => (mediaQuery as any).removeListener(updatePWAStatus);
    }
  }, []);

  return isPWA;
}
