import { supabase } from '@/integrations/supabase/client';

export const generateBiblicalImage = async (
  userPrompt: string, 
  signal?: AbortSignal,
  aspectRatio: 'square' | 'story' | 'landscape' = 'square',
  returnRawUrl: boolean = false,
  source: 'chat' | 'create' = 'chat',
  isComplex: boolean = false
): Promise<string> => {
  // Limpar qualquer prefixo estrutural, tags de arquivos ou colchetes extras do prompt
  const cleanPrompt = userPrompt
    .replace(/\[Modo:[^\]]+\]/g, "")
    .replace(/\[Arquivo:[^\]]+\]/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[\r\n]+/g, " ") // REMOVER quebras de linha para evitar quebras em URLs e Markdowns
    .trim();

  // Chamar o proxy do backend para geração de imagem protegida pelo Sentinel e por token de autenticação
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
        source,
        isComplex
      }),
      signal
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const errMessage = errData?.error || `Status: ${response.status} ${response.statusText}`;
      throw new Error(errMessage);
    }

    const data = await response.json();
    const pollinationsUrl = data.pollinationsUrl;
    const base64Image = data.base64Image;

    if (!pollinationsUrl) {
      throw new Error("O servidor não retornou uma URL de imagem válida.");
    }

    // Se o backend já retornou a imagem convertida em Base64, use-a imediatamente
    if (base64Image) {
      if (returnRawUrl) {
        return base64Image;
      }
      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${base64Image})`;
    }

    try {
      // Baixar e converter a imagem usando a API de Imagens do navegador para contornar restrições de CORS em fetch diretor e limites de IP
      const base64Bytes = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        // Timeout de segurança para evitar carregamentos travados
        const timer = setTimeout(() => {
          img.src = "";
          reject(new Error("O tempo limite para gerar e carregar a imagem no navegador expirou (Timeout)."));
        }, 50000);

        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Não foi possível obter o contexto 2D para renderização local."));
              return;
            }
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            resolve(dataUrl);
          } catch (canvasErr: any) {
            reject(new Error(`Erro ao renderizar imagem localmente: ${canvasErr.message}`));
          }
        };

        img.onerror = () => {
          clearTimeout(timer);
          reject(new Error("Falha ao baixar os bytes da imagem. O serviço pode estar temporariamente congestionado."));
        };

        img.src = pollinationsUrl;
      });

      if (returnRawUrl) {
        return base64Bytes;
      }

      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${base64Bytes})`;
    } catch (fetchErr: any) {
      console.warn("Falha ao converter imagem gerada para base64 local, aplicando fallback com link direto:", fetchErr);
      if (returnRawUrl) {
        return pollinationsUrl;
      }
      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${pollinationsUrl})`;
    }
  } catch (error: any) {
    console.error("Falha ao gerar imagem:", error);
    throw new Error(error.message || "Erro de comunicação ao acionar o serviço de imagens.");
  }
};
