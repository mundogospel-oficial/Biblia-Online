import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  lang?: string;
  continuous?: boolean;
}

// Interface for Web Speech API SpeechRecognition
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export function useVoiceInput({
  onTranscript,
  lang = "pt-BR",
  continuous = false
}: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignored if already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      toast({
        title: "Microfone não suportado",
        description: "Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome no celular.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition: IWindowSpeechRecognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        // Light haptic feedback on mobile if supported
        if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
          try {
            navigator.vibrate(40);
          } catch (e) {
            // ignore
          }
        }
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const trimmed = transcript.trim();
        if (trimmed) {
          onTranscript(trimmed);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast({
            title: "Microfone bloqueado",
            description: "Permita o acesso ao microfone nas configurações do seu navegador para usar a transcrição por voz.",
            variant: "destructive"
          });
        } else if (event.error === "no-speech") {
          // Silent timeout without error toast
        } else if (event.error !== "aborted") {
          toast({
            title: "Não foi possível ouvir",
            description: "Tente falar novamente mais próximo ao microfone.",
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      setIsListening(false);
      toast({
        title: "Erro ao iniciar microfone",
        description: "Não foi possível ativar o microfone no momento.",
        variant: "destructive"
      });
    }
  }, [lang, continuous, onTranscript, toast]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening
  };
}
