import { supabase } from '@/integrations/supabase/client';

/**
 * Image Moderation Service
 * Detects obscene, explicit, adult, pagan, non-Christian, or inappropriate images uploaded or submitted by users.
 */

const EXPLICIT_FILENAME_TERMS = [
  // Explicit / Adult / Sensual
  'nude', 'nudity', 'pelad', 'nuas', 'nus', 'nua', 'sexy', 'peito', 'bumbum', 'bunda',
  'vagina', 'penis', 'sexo', 'erotic', 'sensual', 'porno', 'naked', 'breast', 'butt',
  'ass', 'hentai', 'safada', 'gostosa', 'nsfw', 'adult', 'xxx', 'dick', 'pussy', 'boob',
  'biquini', 'lingerie', 'toples', 'topless',
  // Non-Christian / Occult / Pagan
  'diabo', 'demonio', 'satanas', 'exu', 'pombagira', 'orixa', 'umbanda', 'candomble',
  'bruxaria', 'feitico', 'ocultismo', 'horoscopo', 'tarot', 'baphomet', 'pentagrama',
  // Drugs / Crime / Alcohol
  'maconha', 'cocaina', 'crack', 'drogas', 'arma', 'sangue', 'violencia', 'cerveja', 'vodka'
];

/**
 * Checks whether an uploaded image file contains explicit, non-Christian or inappropriate content.
 */
export async function validateImageContent(file: File): Promise<{ isAppropriate: boolean; reason?: string }> {
  if (!file) return { isAppropriate: true };

  // 1. Check filename for explicit or forbidden terms
  const fileNameLower = file.name.toLowerCase();
  const hasForbiddenName = EXPLICIT_FILENAME_TERMS.some(term => {
    const regex = new RegExp(`(?:^|[^a-z0-9])${term}(?:$|[^a-z0-9])`, 'i');
    return regex.test(fileNameLower);
  });

  if (hasForbiddenName) {
    return {
      isAppropriate: false,
      reason: "Imagem inapropriada ou fora do escopo cristão. Tente novamente."
    };
  }

  // If not an image, pass through to let standard file validator handle format
  if (!file.type.startsWith('image/')) {
    return { isAppropriate: true };
  }

  // 2. Tentar moderação reforçada via servidor backend (/api/moderate-image)
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/moderate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: file.type || "image/jpeg",
        fileName: file.name
      })
    });

    if (res.ok) {
      const serverResult = await res.json().catch(() => null);
      if (serverResult && typeof serverResult.isAppropriate === "boolean") {
        if (!serverResult.isAppropriate) {
          return {
            isAppropriate: false,
            reason: serverResult.reason || "Imagem inapropriada ou fora do escopo cristão. Tente novamente."
          };
        }
        // Servidor já aprovou a moderação com sucesso, retorna instantaneamente
        return { isAppropriate: true };
      }
    }
  } catch (serverErr) {
    console.warn("[Moderation] Servidor inacessível, executando moderação no cliente:", serverErr);
  }

  // 3. Moderação por Análise de Peles / Densidade Visual no Canvas (Client)
  try {
    const isExplicitVisuals = await analyzeImageCanvas(file);
    if (isExplicitVisuals) {
      return {
        isAppropriate: false,
        reason: "Imagem inapropriada ou fora do escopo cristão. Tente novamente."
      };
    }
  } catch (err) {
    console.warn("[Moderation] Non-fatal image canvas analysis error:", err);
  }

  // 4. Moderação por Visão Computacional Gemini (Client Fallback)
  try {
    const isVisionApproved = await analyzeImageWithGeminiVision(file);
    if (!isVisionApproved) {
      return {
        isAppropriate: false,
        reason: "Imagem inapropriada ou fora do escopo cristão. Tente novamente com outra imagem."
      };
    }
  } catch (err) {
    console.warn("[Moderation] Gemini Vision moderation fallback error:", err);
  }

  return { isAppropriate: true };
}

/**
 * Fast client-side image canvas skin-tone and chromaticity analysis
 */
function analyzeImageCanvas(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 120; // Downscale to 120px for rapid performance
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const totalPixels = canvas.width * canvas.height;

        let skinPixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Normalized RGB skin color classification rule
          const isSkinRGB = r > 95 && g > 40 && b > 20 &&
            (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
            Math.abs(r - g) > 15 && r > g && r > b;

          // Normalized YCbCr skin color classification
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          const isSkinYCbCr = cb >= 80 && cb <= 130 && cr >= 132 && cr <= 175;

          if (isSkinRGB && isSkinYCbCr) {
            skinPixelCount++;
          }
        }

        const skinRatio = skinPixelCount / totalPixels;

        // If skin tones dominate > 38% of the image canvas, flag as obscene/inappropriate
        if (skinRatio > 0.38) {
          resolve(true);
          return;
        }

        resolve(false);
      } catch (err) {
        resolve(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };

    img.src = objectUrl;
  });
}

/**
 * Gemini Vision AI visual inspection of attached image file
 */
async function analyzeImageWithGeminiVision(file: File): Promise<boolean> {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/moderate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: file.type || "image/jpeg",
        fileName: file.name
      })
    });

    if (res.ok) {
      const serverResult = await res.json().catch(() => null);
      if (serverResult && typeof serverResult.isAppropriate === "boolean") {
        return serverResult.isAppropriate;
      }
    }
    return true;
  } catch (err) {
    console.warn("[Moderation] Vision moderation proxy error:", err);
    return true;
  }
}

/**
 * Validação Inteligente de Prompts de Geração de Imagem (Modo Criar e Chat)
 * Confiada exclusivamente à inteligência semântica da IA (OpenRouter / OPENROUTER_IMAGENS) no servidor,
 * sem bloqueios rígidos baseados em listas estáticas de palavras que geravam falsos positivos.
 */
export async function validateImagePrompt(prompt: string, context: string = "image"): Promise<{ isAppropriate: boolean; isBlocked?: boolean; reason?: string }> {
  const clean = (prompt || "").trim();
  if (!clean) return { isAppropriate: true, isBlocked: false };

  // Verificação semântica inteligente via Servidor (OpenRouter IA)
  try {
    const res = await fetch('/api/moderate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: clean, context })
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && (data.isBlocked === true || data.isAppropriate === false)) {
        return {
          isAppropriate: false,
          isBlocked: true,
          reason: data.reason || "A descrição fornecida contém elementos que violam as diretrizes de conteúdo visual e bíblico."
        };
      }
    }
  } catch (err) {
    console.warn("[validateImagePrompt] Verificação semântica indisponível, liberando fluxo:", err);
  }

  return { isAppropriate: true, isBlocked: false };
}


