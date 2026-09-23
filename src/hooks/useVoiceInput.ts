import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  lang?: string;
  silenceTimeoutMs?: number; // Tempo de silêncio após a fala para parar automaticamente (padrão: 1200ms)
  maxListeningDurationMs?: number; // Duração máxima contínua de segurança (padrão: 45s)
}

// Interface para a Web Speech API do navegador
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export function useVoiceInput({
  onTranscript,
  lang = "pt-BR",
  silenceTimeoutMs = 1300,
  maxListeningDurationMs = 45000,
}: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const isStoppingRef = useRef<boolean>(false);
  const onTranscriptRef = useRef(onTranscript);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  // Mantém a referência da função de transcrição sempre atualizada
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Verifica compatibilidade inicial
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Limpa todos os temporizadores de silêncio e segurança
  const clearAllTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }
  }, []);

  // Finaliza a escuta e entrega o texto reconhecido
  const stopListening = useCallback(() => {
    clearAllTimers();
    isStoppingRef.current = true;
    setIsListening(false);
    setIsSpeaking(false);

    // Fecha stream de mídia se aberto
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      } catch (e) {
        // ignore
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    }

    // Entrega o texto acumulado final se houver
    const finalTrimmed = accumulatedTranscriptRef.current.trim();
    if (finalTrimmed) {
      onTranscriptRef.current(finalTrimmed);
      accumulatedTranscriptRef.current = "";
    }
  }, [clearAllTimers]);

  // Inicia a escuta com detecção inteligente de silêncio
  const startListening = useCallback(async () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      toast({
        title: "Microfone não suportado",
        description: "Seu navegador atual não suporta reconhecimento de voz direto. Recomendamos usar o Google Chrome.",
        variant: "destructive",
      });
      return;
    }

    // Cancela qualquer sessão anterior
    clearAllTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    accumulatedTranscriptRef.current = "";
    isStoppingRef.current = false;

    // Solicita permissão prévia do microfone no dispositivo (evita falhas silenciosas no mobile/PWA)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setIsListening(false);
          toast({
            title: "Microfone Bloqueado",
            description: "Por favor, autorize o acesso ao microfone nas permissões do seu navegador.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    try {
      const recognition: ISpeechRecognition = new SpeechRecognitionClass();
      recognition.lang = lang;
      recognition.continuous = true; // Permite fala contínua e natural
      recognition.interimResults = true; // Captura palavras em tempo real
      recognition.maxAlternatives = 1;

      // Reseta o temporizador de silêncio após cada palavra detectada
      const resetSilenceTimer = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        // Se a pessoa parar de falar por silenceTimeoutMs (1.3s), encerra automaticamente
        silenceTimerRef.current = setTimeout(() => {
          if (!isStoppingRef.current) {
            // Vibração tátil sutil de conclusão
            if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
              try {
                navigator.vibrate(35);
              } catch (e) {
                // ignore
              }
            }
            stopListening();
          }
        }, silenceTimeoutMs);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setIsSpeaking(false);

        // Haptic feedback de ativação
        if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch (e) {
            // ignore
          }
        }

        // Timeout inicial de 8s caso o usuário ative o microfone mas não fale nada
        noSpeechTimeoutRef.current = setTimeout(() => {
          if (!accumulatedTranscriptRef.current.trim() && !isStoppingRef.current) {
            stopListening();
          }
        }, 8000);

        // Timeout de segurança máxima
        maxDurationTimerRef.current = setTimeout(() => {
          if (!isStoppingRef.current) {
            stopListening();
          }
        }, maxListeningDurationMs);
      };

      recognition.onspeechstart = () => {
        setIsSpeaking(true);
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
      };

      recognition.onspeechend = () => {
        setIsSpeaking(false);
        resetSilenceTimer();
      };

      recognition.onresult = (event: any) => {
        setIsSpeaking(true);
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || "";
          if (res.isFinal) {
            finalTranscript += text + " ";
          } else {
            interimTranscript += text;
          }
        }

        const currentText = (finalTranscript + interimTranscript).trim();
        if (currentText) {
          accumulatedTranscriptRef.current = currentText;
        }

        // Cada vez que uma palavra é falada, reinicia o contador de silêncio
        resetSilenceTimer();
      };

      recognition.onerror = (event: any) => {
        const error = event.error;

        if (error === "no-speech") {
          // Apenas silêncio — encerra sem exibir alerta destrutivo
          stopListening();
        } else if (error === "not-allowed" || error === "service-not-allowed") {
          setIsListening(false);
          clearAllTimers();
          toast({
            title: "Microfone Bloqueado",
            description: "Permita o acesso ao microfone no navegador para usar a fala por voz.",
            variant: "destructive",
          });
        } else if (error !== "aborted") {
          // Erro de rede ou desconexão temporária
          stopListening();
        }
      };

      recognition.onend = () => {
        if (!isStoppingRef.current) {
          // Se encerrou naturalmente pelo navegador
          stopListening();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      setIsListening(false);
      clearAllTimers();
      toast({
        title: "Erro ao ativar microfone",
        description: "Não foi possível abrir o microfone. Tente clicar novamente.",
        variant: "destructive",
      });
    }
  }, [
    lang,
    silenceTimeoutMs,
    maxListeningDurationMs,
    clearAllTimers,
    stopListening,
    toast,
  ]);

  // Alterna o estado do microfone ao clicar
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Limpeza ao desmontar o componente
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch (e) {
          // ignore
        }
      }
    };
  }, [clearAllTimers]);

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
export default useVoiceInput;
