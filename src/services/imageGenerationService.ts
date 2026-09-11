import { supabase } from '@/integrations/supabase/client';
import { APP_WHITE_LOGO_DATA_URL } from '@/assets/appLogoWhite';
import { generateCreateModeImage } from './createModeImageService';
import { validateImagePrompt } from './imageModerationService';

/**
 * ============================================================================
 * SERVIÇO DE GERAÇÃO DE IMAGENS DO CHAT
 * ============================================================================
 * DIRETRIZ PERMANENTE:
 * - A Pollinations IA é de uso EXCLUSIVO do Modo Criar (createModeImageService).
 * - O Chat utiliza exclusivamente o motor de IA via backend.
 * - NUNCA acionar Pollinations IA para o Chat.
 * ============================================================================
 */

// Singleton cache para a logo do aplicativo em branco
let watermarkLogoCache: HTMLImageElement | null = null;
const getWatermarkLogo = (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (watermarkLogoCache && watermarkLogoCache.complete && watermarkLogoCache.naturalWidth) {
      resolve(watermarkLogoCache);
      return;
    }
    const img = new Image();
    img.onload = () => {
      watermarkLogoCache = img;
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = APP_WHITE_LOGO_DATA_URL;
  });
};

/**
 * Desenha a marca d'água permanente do app (logo branca com transparência e sombra)
 * diretamente no canvas da imagem gerada.
 */
export const drawWatermarkOnCanvas = (
  ctx: CanvasRenderingContext2D, 
  canvasWidth: number, 
  canvasHeight: number, 
  logoImg?: HTMLImageElement | null
) => {
  try {
    const watermarkImg = logoImg || watermarkLogoCache;
    if (!watermarkImg || !watermarkImg.complete || !watermarkImg.naturalWidth) return;

    const w = canvasWidth;
    const h = canvasHeight;

    const watermarkHeight = Math.max(32, Math.round(h * 0.065));
    const aspect = (watermarkImg.naturalWidth || 200) / (watermarkImg.naturalHeight || 200);
    const watermarkWidth = Math.round(watermarkHeight * aspect);

    const paddingRight = Math.max(12, Math.round(w * 0.035));
    const paddingBottom = Math.max(12, Math.round(h * 0.035));

    const x = w - watermarkWidth - paddingRight;
    const y = h - watermarkHeight - paddingBottom;

    ctx.save();
    ctx.globalAlpha = 0.50;
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = Math.round(watermarkHeight * 0.15);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
    ctx.restore();
  } catch (err) {
    console.warn("[Watermark] Erro ao desenhar marca d'água no canvas:", err);
  }
};

/**
 * Garante que qualquer imagem (data URL ou HTTP) receba a marca d'água carimbada no canvas em base64
 */
export const ensureWatermarkedImage = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return imageUrl;

  try {
    const logoImg = await getWatermarkLogo();
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const timeout = setTimeout(() => {
        resolve(imageUrl);
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 1024;
          canvas.height = img.naturalHeight || img.height || 1024;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(imageUrl);
            return;
          }
          ctx.drawImage(img, 0, 0);
          drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, logoImg);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
        } catch (canvasErr) {
          console.warn("[Watermark] Falha ao gravar no canvas:", canvasErr);
          resolve(imageUrl);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(imageUrl);
      };

      img.src = imageUrl;
    });
  } catch {
    return imageUrl;
  }
};

/**
 * Geração de Imagens Bíblicas:
 * - Se source === 'create', delega 100% para o serviço dedicado do Modo Criar (Pollinations IA).
 * - Se source === 'chat', aciona exclusivamente o motor de IA dedicado no backend.
 */
export const generateBiblicalImage = async (
  userPrompt: string, 
  signal?: AbortSignal,
  aspectRatio: 'square' | 'story' | 'landscape' = 'square',
  returnRawUrl: boolean = false,
  source: 'chat' | 'create' = 'chat',
  isComplex: boolean = false,
  isAlreadyRefined: boolean = false
): Promise<string> => {
  // Se a chamada for destinada ao Modo Criar, delega para o serviço dedicado
  if (source === 'create') {
    return generateCreateModeImage(userPrompt, {
      signal,
      aspectRatio,
      returnRawUrl,
      isComplex
    });
  }

  // Limpar apenas tags internas de sistema/arquivos, PRESERVANDO a tag de [Estilo: ...]
  const cleanPrompt = userPrompt
    .replace(/\[Modo:[^\]]+\]/g, "")
    .replace(/\[Arquivo:[^\]]+\]/g, "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  const displayPrompt = cleanPrompt.replace(/\[Estilo:\s*[^\]]+\]/gi, '').trim() || cleanPrompt;
  const shouldWatermark = true;

  // Verificação de segurança prévia (Filtros Combinados)
  // Se o prompt já foi refinado e higienizado pelo Aprimorador oficial (isAlreadyRefined),
  // as regras de decência bíblica já foram aplicadas, evitando bloqueios indevidos
  if (!isAlreadyRefined) {
    const security = await validateImagePrompt(cleanPrompt, 'chat');
    if (security.isBlocked || !security.isAppropriate) {
      throw new Error(security.reason || "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual e bíblico.");
    }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: cleanPrompt,
        aspectRatio,
        source: 'chat',
        isComplex,
        isAlreadyRefined
      }),
      signal
    });

    if (!response.ok) {
      let errMessage = "Não foi possível gerar a imagem no momento. Tente novamente em instantes.";
      try {
        const errData = await response.json();
        if (errData && (errData.error || errData.message)) {
          const raw = errData.error || errData.message;
          if (typeof raw === 'string' && !raw.includes("HTTP") && !raw.includes("status") && !raw.includes("{" ) && raw.length < 150) {
            errMessage = raw;
          }
        }
      } catch {
        // Ignora erros de parsing e usa mensagem amigável padrão
      }
      throw new Error(errMessage);
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      throw new Error("Não foi possível processar a resposta do servidor de imagens.");
    }
    const base64Image = data.base64Image || data.imageUrl;

    if (!base64Image) {
      throw new Error("Não foi possível carregar a imagem. Tente novamente.");
    }

    const watermarkedBase64 = shouldWatermark ? await ensureWatermarkedImage(base64Image) : base64Image;
    if (returnRawUrl) {
      return watermarkedBase64;
    }
    return `Aqui está a imagem gerada para: "${displayPrompt}"\n\n![${displayPrompt}](${watermarkedBase64})`;
  } catch (error: any) {
    const isAbort = error?.name === 'AbortError' || signal?.aborted || error?.message?.toLowerCase().includes('abort');
    if (isAbort) {
      const abortError = new Error("Geração interrompida.");
      abortError.name = "AbortError";
      throw abortError;
    }
    console.error("[Chat - Erro ao gerar imagem]:", error);
    let msg = error.message || "Não foi possível gerar a imagem. Tente novamente.";
    if (msg.includes("Failed to fetch") || msg.includes("fetch failed") || msg.includes("NetworkError")) {
      msg = "Erro de conexão de rede. Verifique sua internet e tente novamente em instantes.";
    } else if (msg.includes("HTTP") || msg.includes("Status ") || msg.includes("status") || msg.includes("{")) {
      msg = "Não foi possível gerar a imagem no momento. Tente novamente em instantes.";
    }
    throw new Error(msg);
  }
};

/**
 * Aprimorador de Prompts bíblicos usando OpenRouter (OPENROUTER_IMAGENS) no servidor.
 * Analisa e enriquece clareza, riqueza de detalhes visuais e iluminação
 * mantendo RIGOROSAMENTE o cenário original e o contexto bíblico intactos.
 */
export const refinePromptWithAI = async (
  prompt: string,
  mode: string = 'image',
  style?: string,
  signal?: AbortSignal,
  previousPrompt?: string,
  changeRequested?: string
): Promise<{ refinedPrompt: string; isBlocked?: boolean }> => {
  const clean = (prompt || "").trim();
  if (!clean) return { refinedPrompt: "" };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch('/api/prompt/refine', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: clean,
        mode,
        style,
        previousPrompt: previousPrompt ? previousPrompt.trim() : undefined,
        changeRequested: changeRequested ? changeRequested.trim() : undefined
      }),
      signal
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.refinedPrompt) {
        return { refinedPrompt: data.refinedPrompt, isBlocked: false };
      }
    } else {
      const err = await response.json().catch(() => ({}));
      if (err?.isBlocked || (err?.error && err.error.includes("diretrizes"))) {
        return { refinedPrompt: "", isBlocked: true };
      }
    }
  } catch (error: any) {
    if (error?.name === 'AbortError' || signal?.aborted || error?.message?.toLowerCase().includes('abort')) {
      const abortError = new Error("Refinamento interrompido.");
      abortError.name = "AbortError";
      throw abortError;
    }
    console.warn("[refinePromptWithAI] Falha na comunicação com o servidor:", error);
  }

  return { refinedPrompt: clean, isBlocked: false };
};

