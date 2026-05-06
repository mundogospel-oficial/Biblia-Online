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
        title: "Solicitando permissão",
        description: "Permita o acesso para salvar a imagem em suas fotos.",
      });
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: isMobile ? "Download iniciado" : "Imagem baixada! 📥",
      description: `Salvo como ${fileName}`
    });
  } catch (error) {
    console.error("Download error:", error);
    toast({ 
      title: "Erro ao baixar", 
      description: "Não foi possível completar o download.",
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
      // Direct data URL to blob conversion
      const response = await fetch(dataUrl);
      blob = await response.blob();
    } else {
      // External URL
      const response = await fetch(dataUrl, { mode: 'cors' });
      blob = await response.blob();
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
