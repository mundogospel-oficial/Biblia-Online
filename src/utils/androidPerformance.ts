/**
 * Utilitário de Otimização de Desempenho e Efeitos para Android Básico
 * 
 * Detecta se o dispositivo é um smartphone Android com recursos de hardware básicos
 * (ex: memória RAM <= 4GB, <= 4 núcleos de CPU, modo de economia de dados/bateria, etc.)
 * 
 * CRUCIAL: Não afeta PCs, Macs, iPhones, iPads e nem celulares Android topo de linha,
 * mantendo 100% dos efeitos visuais ricos (blur, sombras e transições) nesses dispositivos.
 */

export type AndroidPerfMode = "auto" | "optimized" | "standard";

const STORAGE_KEY = "biblia_android_perf_mode";

/**
 * Identifica se o dispositivo atual é especificamente um Android.
 */
export const isAndroidDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua);
};

/**
 * Avalia se o dispositivo é um Android de categoria básica / entrada:
 * - RAM informada pela API deviceMemory <= 4GB
 * - CPU com <= 4 threads/núcleos
 * - Modo economia de dados ativado
 * - Preferência do sistema por movimento reduzido (economia de energia)
 */
export const isBasicAndroidDevice = (): boolean => {
  if (!isAndroidDevice()) {
    // Nunca ativa em PCs, Macs, iPhones, iPads ou outros sistemas
    return false;
  }

  // Verifica se há preferência manual salva pelo usuário
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "optimized") return true;
    if (saved === "standard") return false;
  }

  // 1. Memória RAM (disponível no Chrome/Chromium no Android)
  const nav = navigator as any;
  const deviceMemory = nav.deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4) {
    return true;
  }

  // 2. Núcleos de processamento (SoCs de entrada como MediaTek Helio A/P, Unisoc, Snapdragon 4xx)
  const concurrency = navigator.hardwareConcurrency;
  if (typeof concurrency === "number" && concurrency > 0 && concurrency <= 4) {
    return true;
  }

  // 3. Economia de bateria / Modo de movimento reduzido no Android
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }

  // 4. Economia de dados do navegador Android
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (connection && (connection.saveData === true || connection.effectiveType === "2g" || connection.effectiveType === "3g")) {
    return true;
  }

  // 5. Se a memória não puder ser medida, mas a tela tiver baixa resolução/pixel ratio típico de entrada
  if (typeof window !== "undefined" && window.screen) {
    const minDim = Math.min(window.screen.width, window.screen.height);
    const dpr = window.devicePixelRatio || 1;
    if (minDim <= 360 && dpr <= 2 && typeof concurrency === "number" && concurrency <= 6) {
      return true;
    }
  }

  return false;
};

/**
 * Aplica ou remove as classes no elemento raiz (HTML) para otimizar os efeitos.
 */
export const applyAndroidPerformanceMode = (mode?: AndroidPerfMode): boolean => {
  if (typeof document === "undefined") return false;

  let active = false;
  const currentMode = mode || (getAndroidPerfMode() || "auto");

  if (!isAndroidDevice()) {
    document.documentElement.classList.remove("android-low-end");
    document.documentElement.removeAttribute("data-android-optimized");
    return false;
  }

  if (currentMode === "optimized") {
    active = true;
  } else if (currentMode === "standard") {
    active = false;
  } else {
    // Modo "auto": detecta com base no hardware
    active = isBasicAndroidDevice();
  }

  if (active) {
    document.documentElement.classList.add("android-low-end");
    document.documentElement.setAttribute("data-android-optimized", "true");
  } else {
    document.documentElement.classList.remove("android-low-end");
    document.documentElement.removeAttribute("data-android-optimized");
  }

  return active;
};

export const getAndroidPerfMode = (): AndroidPerfMode => {
  if (typeof localStorage === "undefined") return "auto";
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === "optimized" || val === "standard") return val;
  return "auto";
};

export const setAndroidPerfMode = (mode: AndroidPerfMode): boolean => {
  if (typeof localStorage !== "undefined") {
    if (mode === "auto") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }
  return applyAndroidPerformanceMode(mode);
};
