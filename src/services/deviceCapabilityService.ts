/**
 * Serviço de detecção de capacidades do dispositivo para o PWA (Bíblia Online)
 * 
 * Regras estritas:
 * 1. iOS (iPhone, iPad, iPod) e PC (Windows, Mac, Linux) NUNCA recebem qualquer redução
 *    ou otimização de efeitos gráficos. Operam sempre com 100% dos efeitos liquid glass e brilho.
 * 2. Android com 4GB ou mais de RAM também opera sempre com 100% dos efeitos visuais plenos.
 * 3. EXCLUSIVAMENTE dispositivos Android com MENOS de 4GB de RAM têm os efeitos pesados
 *    suavemente adaptados para evitar engasgos no hardware de entrada.
 * 4. A barra de navegação (superior e inferior) permanece sempre intacta com visual pleno em todos os dispositivos.
 */

export interface DeviceCapability {
  os: "android" | "ios" | "pc";
  isAndroid: boolean;
  isIOS: boolean;
  isPC: boolean;
  ramGB: number | null;
  isLowRamAndroid: boolean;
}

export function detectDeviceCapabilities(): DeviceCapability {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      os: "pc",
      isAndroid: false,
      isIOS: false,
      isPC: true,
      ramGB: null,
      isLowRamAndroid: false,
    };
  }

  const ua = (navigator.userAgent || "").toLowerCase();

  // 1. Detecção estrita de iOS (iPhone, iPad, iPod ou iPadOS no Safari MacIntel com touch)
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // 2. Detecção estrita de Android
  const isAndroid = !isIOS && /android/i.test(ua);

  // 3. Detecção estrita de PC / Desktop (Windows, macOS, Linux, ChromeOS, etc.)
  const isPC = !isAndroid && !isIOS;
  const os: "android" | "ios" | "pc" = isAndroid ? "android" : isIOS ? "ios" : "pc";

  // BLOQUEIO REFORÇADO: iOS e PC NUNCA entram em modo low-ram
  if (isIOS || isPC || !isAndroid) {
    return {
      os,
      isAndroid: false,
      isIOS,
      isPC,
      ramGB: null,
      isLowRamAndroid: false, // JAMAIS ativado para iOS ou PC
    };
  }

  // A partir daqui, é comprovadamente Android.
  // Verifica se o Android possui menos de 4GB de RAM.
  let ramGB: number | null = null;
  let isLowRamAndroid = false;

  // navigator.deviceMemory retorna a RAM aproximada em GiB (0.25, 0.5, 1, 2, 4, 8)
  if ("deviceMemory" in navigator && typeof (navigator as any).deviceMemory === "number") {
    ramGB = (navigator as any).deviceMemory;
    // Somente se for estritamente MENOR que 4GB de RAM
    if (ramGB !== null && ramGB < 4) {
      isLowRamAndroid = true;
    }
  } else if (
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4
  ) {
    // Fallback apenas para aparelhos Android muito antigos/fracos (<= 4 núcleos)
    // se o browser não expuser deviceMemory
    isLowRamAndroid = true;
  }

  // Suporte a teste manual forçado se configurado explicitamente no localStorage
  try {
    if (localStorage.getItem("force_low_ram_android") === "true") {
      isLowRamAndroid = true;
    }
  } catch {}

  return {
    os: "android",
    isAndroid: true,
    isIOS: false,
    isPC: false,
    ramGB,
    isLowRamAndroid,
  };
}

/**
 * Inicializa e aplica os atributos de classes no elemento <html> imediatamente
 */
export function initDeviceOptimization(): DeviceCapability {
  const cap = detectDeviceCapabilities();

  if (typeof document !== "undefined" && document.documentElement) {
    const root = document.documentElement;

    // Define atributos explícitos de sistema operacional
    root.dataset.os = cap.os;
    root.dataset.pwaOs = cap.os;

    if (cap.isIOS) {
      root.classList.add("device-ios");
      root.classList.remove("device-android", "device-pc", "low-ram-android");
      console.log("[PWA Perf] iOS / iPhone / iPad detectado: Efeitos visuais e liquid glass 100% plenos (sem otimização).");
    } else if (cap.isPC) {
      root.classList.add("device-pc");
      root.classList.remove("device-android", "device-ios", "low-ram-android");
      console.log("[PWA Perf] PC / Desktop detectado: Efeitos visuais e liquid glass 100% plenos (sem otimização).");
    } else if (cap.isAndroid) {
      root.classList.add("device-android");
      root.classList.remove("device-ios", "device-pc");

      if (cap.ramGB !== null) {
        root.dataset.ram = String(cap.ramGB);
      }

      // EXCLUSIVO: Apenas Android com menos de 4GB de RAM recebe a classe low-ram-android
      if (cap.isLowRamAndroid) {
        root.classList.add("low-ram-android");
        console.log(
          `[PWA Perf] Android de entrada com RAM < 4GB detectado (${cap.ramGB ? `${cap.ramGB}GB` : "<4 núcleos"}). Efeitos pesados suavizados para máxima fluidez.`
        );
      } else {
        root.classList.remove("low-ram-android");
        console.log(
          `[PWA Perf] Android com 4GB+ de RAM detectado (${cap.ramGB ? `${cap.ramGB}GB` : "potente"}). Efeitos liquid glass 100% plenos.`
        );
      }
    }

    // Disponibiliza no objeto window para diagnóstico do desenvolvedor
    try {
      (window as any).__DEVICE_CAPABILITY__ = cap;
    } catch {}
  }

  return cap;
}

