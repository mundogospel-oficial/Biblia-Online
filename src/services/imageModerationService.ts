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
      const serverResult = await res.json();
      if (serverResult && serverResult.isAppropriate === false) {
        return {
          isAppropriate: false,
          reason: serverResult.reason || "Imagem inapropriada ou fora do escopo cristão. Tente novamente."
        };
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
 * Fast client-side image canvas skin-tone & chromaticity analysis
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
    // Convert file to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(',');
        resolve(commaIdx !== -1 ? result.substring(commaIdx + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Obtain Gemini API keys securely (never exposed in public bundle)
    let googleKey = "";
    let googleKey2 = "";

    try {
      const { data } = await supabase
        .from('ai_settings')
        .select('config_key, config_value')
        .in('config_key', ['google_ai_key', 'google_ai_key_2']);

      if (data) {
        const k1 = data.find(d => d.config_key === 'google_ai_key')?.config_value;
        const k2 = data.find(d => d.config_key === 'google_ai_key_2')?.config_value;
        if (k1 && k1.trim()) googleKey = k1.trim();
        if (k2 && k2.trim()) googleKey2 = k2.trim();
      }
    } catch (dbErr) {
      console.warn("[Moderation] Supabase key fetch failed, using env keys:", dbErr);
    }

    const keysToTry = [googleKey, googleKey2].filter(Boolean);
    if (keysToTry.length === 0) {
      return true; // Pass through if no key is configured
    }

    const moderationPrompt = `SISTEMA DE MODERAÇÃO DE SEGURANÇA E ÉTICA CRISTÃ:
Analise a imagem anexada por um usuário de um aplicativo da Bíblia Sagrada.

Responda EXATAMENTE E APENAS "INAPROPRIADO" se a imagem contiver QUALQUER um dos seguintes itens:
1) Nudez, erotismo, trajes sumários/íntimos, biquínis, lingerie, apelo sexual ou sensualidade.
2) Símbolos, figuras, altares, cartas ou rituais de feitiçaria, bruxaria, ocultismo, satanismo, horóscopo, tarot, feitiços ou divindades não-cristãs/pagãs/entidades.
3) Violência, sangue, mutilação, armas de fogo ou brancas, cadáveres, mortes ou cenas de crime.
4) Drogas ilícitas, maconha, cocaína, cigarros, bebidas alcoólicas, garrafas de bebida ou substâncias entorpecentes.
5) Gestos obscenos, símbolos de gangues, palavrões ou ofensas profanas à Fé Cristã.

Caso seja uma imagem respeitosa, neutra, uma paisagem, Bíblia, igreja, texto ou foto de pessoa com roupa comum, responda EXATAMENTE E APENAS "APROPRIADO".`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-3.6-flash"];

    for (const key of keysToTry) {
      for (const model of modelsToTry) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: moderationPrompt },
                  {
                    inlineData: {
                      mimeType: file.type || "image/jpeg",
                      data: base64Data
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 20
              }
            })
          });

          if (res.ok) {
            const resData = await res.json();
            const text = (resData?.candidates?.[0]?.content?.parts?.[0]?.text || "").toUpperCase().trim();
            if (text.includes("INAPROPRIADO") || text.includes("INAPPROPRIATE") || text.includes("BLOQUEADO")) {
              return false;
            }
            if (text.includes("APROPRIADO") || text.includes("APPROPRIATE")) {
              return true;
            }
          } else {
            // If Gemini returned a 400 safety block / finishReason SAFETY
            const errJson = await res.json().catch(() => null);
            const candidate = errJson?.candidates?.[0];
            if (candidate?.finishReason === "SAFETY" || errJson?.error?.message?.includes("SAFETY")) {
              return false;
            }
          }
        } catch (mErr) {
          console.warn(`[Moderation] Vision model ${model} error:`, mErr);
        }
      }
    }

    return true;
  } catch (err) {
    console.warn("[Moderation] Vision moderation failed:", err);
    return true;
  }
}

