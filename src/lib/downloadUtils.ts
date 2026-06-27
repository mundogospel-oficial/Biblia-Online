/**
 * Utility for handling image downloads with specific naming and platform checks.
 */
import { toast } from "@/hooks/use-toast";

export const downloadBibleImage = async (dataUrl: string, fileNamePrefix: string = "biblia-online") => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const timestamp = Date.now();
  const fileName = `${fileNamePrefix}-${timestamp}.png`;

  try {
    if (isMobile) {
      toast({
        title: "Iniciando download",
        description: "A imagem será salva em sua pasta de downloads ou fotos.",
      });
    }

    let downloadUrl = dataUrl;
    
    // For external URLs, fetch the blob to avoid CORS issues and ensure download attribute works
    if (dataUrl.startsWith('http')) {
      try {
        const response = await fetch(dataUrl, { mode: 'cors' });
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
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
      // Clean up the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    }
    
    toast({ 
      title: isMobile ? "Download iniciado" : "Imagem baixada! 📥",
      description: `Salvo como ${fileName}`
    });
  } catch (error) {
    console.error("Download error:", error);
    toast({ 
      title: "Erro ao baixar", 
      description: "Houve um problema de permissão ou rede. Tente usar o botão Compartilhar.",
      variant: "destructive" 
    });
  }
};

export const shareBibleImage = async (dataUrl: string, fileNamePrefix: string = "biblia-online") => {
  const timestamp = Date.now();
  const fileName = `${fileNamePrefix}-${timestamp}.png`;

  try {
    const isDataUrl = dataUrl.startsWith('data:');
    let blob: Blob;
    
    if (isDataUrl) {
      // Direct data URL to blob conversion (synchronous & extremely robust)
      try {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        blob = new Blob([new Uint8Array(array)], { type: mime });
      } catch (decodeErr) {
        console.error("DataURL sync decode failed, falling back to fetch", decodeErr);
        const response = await fetch(dataUrl);
        blob = await response.blob();
      }
    } else {
      // External URL
      try {
        const response = await fetch(dataUrl, { mode: 'cors' });
        blob = await response.blob();
      } catch (fetchErr) {
        console.warn("Fetch failed, trying to share as URL link directly", fetchErr);
        // Fallback: if we cannot fetch, share as link via Web Share API
        if (navigator.share) {
          await navigator.share({
            title: "Imagem Bíblica",
            text: "Veja este versículo que criei!",
            url: dataUrl
          });
          return;
        }
        throw fetchErr; // proceed to clipboard/download fallback
      }
    }
      
    const file = new File([blob], fileName, { type: "image/png" });

    // Web Share API with File support
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: fileName, // Using filename as title sometimes helps OS with previews
        text: "Veja este versículo que criei!",
      });
      return;
    } 
    
    // Fallback: Copy to clipboard if Share API is not available or rejected
    try {
      if (typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        toast({
          title: "Copiado para transferência",
          description: "Seu sistema não suporta o menu de compartilhamento de arquivos. A imagem foi copiada para você colar onde desejar.",
        });
        return;
      }
    } catch (clipboardErr) {
      console.warn("Clipboard fallback failed", clipboardErr);
    }

    // Final fallback: Forced Download
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download iniciado",
      description: "Menu de compartilhamento não disponível. Imagem salva no dispositivo.",
    });
  } catch (error) {
    console.error("Share error:", error);
    toast({
      title: "Erro ao compartilhar",
      description: "Houve um problema ao processar o arquivo da imagem.",
      variant: "destructive",
    });
  }
};
