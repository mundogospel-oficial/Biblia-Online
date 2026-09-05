/**
 * Utility for handling image and text downloads/sharing with cross-platform fallbacks.
 */
import { toast } from "@/hooks/use-toast";
import { cropBlackBars } from "./imageCropUtils";

export const generateProfessionalFileName = (prefix: string = "Biblia-Online"): string => {
  if (/\.(png|jpg|jpeg|webp)$/i.test(prefix)) {
    return prefix;
  }

  let clean = prefix
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // removes accents e.g. Bíblia -> Biblia
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .replace(/\s+/g, "-");

  if (!clean || clean === "-") {
    clean = "Biblia-Online";
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}_${hours}h${minutes}`;

  return `${clean}_${formattedDate}.png`;
};

export const downloadBibleImage = async (dataUrl: string, fileNamePrefix: string = "Biblia-Online") => {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const fileName = generateProfessionalFileName(fileNamePrefix);

  try {
    const cleanUrl = await cropBlackBars(dataUrl);
    let downloadUrl = cleanUrl;
    
    // For external URLs, fetch the blob to avoid CORS issues and ensure download attribute works
    if (cleanUrl.startsWith('http')) {
      try {
        const response = await fetch(cleanUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          downloadUrl = URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn("Could not proxy download via CORS blob, using direct URL", err);
        downloadUrl = cleanUrl;
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

export const shareBibleImage = async (dataUrl: string, fileNamePrefix: string = "Biblia-Online") => {
  const fileName = generateProfessionalFileName(fileNamePrefix);

  try {
    const cleanUrl = await cropBlackBars(dataUrl);
    let blob: Blob | null = null;
    
    if (cleanUrl.startsWith('data:')) {
      // Direct data URL to blob conversion via fetch or atob
      try {
        const res = await fetch(cleanUrl);
        blob = await res.blob();
      } catch {
        try {
          const parts = cleanUrl.split(',');
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
    } else if (cleanUrl.startsWith('blob:')) {
      try {
        const res = await fetch(cleanUrl);
        blob = await res.blob();
      } catch (e) {
        console.warn("Fetch blob URL failed", e);
      }
    } else {
      // External HTTP URL
      try {
        const response = await fetch(cleanUrl, { mode: 'cors' });
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
