/**
 * Utility for handling image and text downloads/sharing with cross-platform fallbacks.
 */
import { toast } from "@/hooks/use-toast";

export const downloadBibleImage = async (dataUrl: string, fileNamePrefix: string = "biblia-online") => {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const timestamp = Date.now();
  const fileName = `${fileNamePrefix}-${timestamp}.png`;

  try {
    if (isMobile) {
      toast({
        title: "Iniciando download",
        description: "A imagem será salva no seu dispositivo.",
      });
    }

    let downloadUrl = dataUrl;
    
    // For external URLs, fetch the blob to avoid CORS issues and ensure download attribute works
    if (dataUrl.startsWith('http')) {
      try {
        const response = await fetch(dataUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          downloadUrl = URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn("Could not proxy download via CORS blob, using direct URL", err);
        downloadUrl = dataUrl;
      }
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (downloadUrl.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }
    
    toast({ 
      title: "Imagem baixada com sucesso",
      description: `Arquivo: ${fileName}`
    });
  } catch (error) {
    console.error("Download error:", error);
    toast({ 
      title: "Erro ao baixar", 
      description: "Houve um problema de permissão ou rede.",
      variant: "destructive" 
    });
  }
};

export const shareBibleImage = async (dataUrl: string, fileNamePrefix: string = "biblia-online") => {
  const timestamp = Date.now();
  const fileName = `${fileNamePrefix}-${timestamp}.png`;

  try {
    let blob: Blob | null = null;
    
    if (dataUrl.startsWith('data:')) {
      // Direct data URL to blob conversion via fetch or atob
      try {
        const res = await fetch(dataUrl);
        blob = await res.blob();
      } catch {
        try {
          const parts = dataUrl.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
          const binary = atob(parts[1]);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }
          blob = new Blob([array], { type: mime });
        } catch (decodeErr) {
          console.error("DataURL decode failed", decodeErr);
        }
      }
    } else if (dataUrl.startsWith('blob:')) {
      try {
        const res = await fetch(dataUrl);
        blob = await res.blob();
      } catch (e) {
        console.warn("Fetch blob URL failed", e);
      }
    } else {
      // External HTTP URL
      try {
        const response = await fetch(dataUrl, { mode: 'cors' });
        if (response.ok) {
          blob = await response.blob();
        }
      } catch (fetchErr) {
        console.warn("Fetch external image failed", fetchErr);
      }
    }

    // Try Web Share API with File
    if (blob) {
      const mimeType = blob.type || "image/png";
      const file = new File([blob], fileName, { type: mimeType });

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        let canShareFile = false;
        try {
          canShareFile = navigator.canShare({ files: [file] });
        } catch {
          canShareFile = false;
        }

        if (canShareFile) {
          try {
            await navigator.share({
              files: [file],
              title: "Bíblia Online",
              text: "Veja esta imagem da Bíblia Online!",
            });
            toast({ title: "Compartilhado com sucesso" });
            return;
          } catch (shareErr: any) {
            console.warn("navigator.share failed or was canceled:", shareErr);
            // If user explicitly cancelled/aborted, don't show error toast or run fallbacks
            if (shareErr?.name === 'AbortError' || shareErr?.name === 'CanceledError' || shareErr?.message?.includes('cancel')) {
              return;
            }
            // Otherwise, fall through to Clipboard / Download fallbacks
          }
        }
      }

      // Fallback 1: Clipboard API with PNG image
      try {
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
          let pngBlob = blob;
          if (blob.type !== 'image/png') {
            pngBlob = new Blob([blob], { type: 'image/png' });
          }
          const item = new ClipboardItem({ [pngBlob.type]: pngBlob });
          await navigator.clipboard.write([item]);
          toast({
            title: "Imagem copiada",
            description: "A imagem foi copiada para a área de transferência.",
          });
          return;
        }
      } catch (clipErr) {
        console.warn("ClipboardItem write failed:", clipErr);
      }
    }

    // Fallback 2: Direct URL sharing via Web Share API if blob sharing failed
    if (dataUrl.startsWith('http') && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: "Bíblia Online",
          text: "Veja esta imagem!",
          url: dataUrl,
        });
        toast({ title: "Link compartilhado com sucesso" });
        return;
      } catch (urlShareErr: any) {
        if (urlShareErr?.name === 'AbortError' || urlShareErr?.name === 'CanceledError') {
          return;
        }
      }
    }

    // Fallback 3: Direct Download
    await downloadBibleImage(dataUrl, fileNamePrefix);
  } catch (error) {
    console.error("Share error:", error);
    try {
      await downloadBibleImage(dataUrl, fileNamePrefix);
    } catch {
      toast({
        title: "Download iniciado",
        description: "A imagem foi enviada para salvamento.",
      });
    }
  }
};

export const shareBibleText = async (text: string, title: string = "Bíblia Online") => {
  if (!text) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
        });
        toast({ title: "Compartilhado com sucesso" });
        return;
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError' || shareErr?.name === 'CanceledError' || shareErr?.message?.includes('cancel')) {
          return;
        }
      }
    }

    // Fallback to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Texto copiado",
        description: "O texto foi copiado para a área de transferência.",
      });
      return;
    }
  } catch (err) {
    console.error("Share text error:", err);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast({ title: "Texto copiado" });
      }
    } catch {
      toast({ title: "Erro ao copiar ou compartilhar texto.", variant: "destructive" });
    }
  }
};
