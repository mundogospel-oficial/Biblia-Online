import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  lang?: string;
  silenceTimeoutMs?: number; // Tempo de silêncio após a fala para finalizar automaticamente (padrão: 1300ms)
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
  const sessionIdRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const onTranscriptRef = useRef(onTranscript);

  const { toast } = useToast();

  // Mantém a referência da função de transcrição sempre atualizada
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Checagem de suporte do navegador
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
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

  // Finaliza a escuta de forma limpa e entrega o texto reconhecido
  const stopListening = useCallback(() => {
    clearAllTimers();
    setIsListening(false);
    setIsSpeaking(false);

    // Entrega o texto acumulado final se houver
    const finalTrimmed = accumulatedTranscriptRef.current.trim();
    if (finalTrimmed) {
      onTranscriptRef.current(finalTrimmed);
      accumulatedTranscriptRef.current = "";
    }

    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      // Remove listeners para evitar disparos zumbis após o stop
      rec.onstart = null;
      rec.onspeechstart = null;
      rec.onspeechend = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;

      try {
        rec.stop();
      } catch (err) {
        try {
          rec.abort();
        } catch (e) {
          // ignore
        }
      }
      recognitionRef.current = null;
    }
  }, [clearAllTimers]);

  // Inicia a escuta com detecção inteligente de silêncio
  const startListening = useCallback(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      toast({
        title: "Microfone não suportado",
        description: "Seu navegador não suporta reconhecimento de voz direto. Recomendamos usar o Google Chrome.",
        variant: "destructive",
      });
      return;
    }

    // 1. Limpa completamente qualquer sessão e instância anterior
    clearAllTimers();
    if (recognitionRef.current) {
      const oldRec = recognitionRef.current;
      oldRec.onstart = null;
      oldRec.onspeechstart = null;
      oldRec.onspeechend = null;
      oldRec.onresult = null;
      oldRec.onerror = null;
      oldRec.onend = null;
      try {
        oldRec.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Gera um novo ID de sessão para isolar eventos de execuções anteriores
    const currentSessionId = Date.now();
    sessionIdRef.current = currentSessionId;
    accumulatedTranscriptRef.current = "";

    try {
      const recognition: ISpeechRecognition = new SpeechRecognitionClass();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Reseta o temporizador de silêncio após cada palavra detectada
      const resetSilenceTimer = () => {
        if (sessionIdRef.current !== currentSessionId) return;

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        // Se a pessoa parar de falar por silenceTimeoutMs (1.3s), encerra automaticamente
        silenceTimerRef.current = setTimeout(() => {
          if (sessionIdRef.current === currentSessionId) {
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
        if (sessionIdRef.current !== currentSessionId) return;
        setIsListening(true);
        setIsSpeaking(false);

        // Feedback tátil de ativação
        if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch (e) {
            // ignore
          }
        }

        // Timeout inicial de 8s se o usuário abrir o microfone e não falar nada
        noSpeechTimeoutRef.current = setTimeout(() => {
          if (sessionIdRef.current === currentSessionId && !accumulatedTranscriptRef.current.trim()) {
            stopListening();
          }
        }, 8000);

        // Timeout máximo de segurança
        maxDurationTimerRef.current = setTimeout(() => {
          if (sessionIdRef.current === currentSessionId) {
            stopListening();
          }
        }, maxListeningDurationMs);
      };

      recognition.onspeechstart = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        setIsSpeaking(true);
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
      };

      recognition.onspeechend = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        setIsSpeaking(false);
        resetSilenceTimer();
      };

      recognition.onresult = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        setIsSpeaking(true);

        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
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

        // Reinicia o contador de silêncio a cada palavra falada
        resetSilenceTimer();
      };

      recognition.onerror = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        const error = event.error;

        if (error === "no-speech") {
          // Apenas silêncio — encerra sem toast de erro
          stopListening();
        } else if (error === "not-allowed" || error === "service-not-allowed") {
          setIsListening(false);
          clearAllTimers();
          toast({
            title: "Microfone Bloqueado",
            description: "Permita o acesso ao microfone no seu navegador para usar a transcrição por voz.",
            variant: "destructive",
          });
        } else if (error !== "aborted") {
          stopListening();
        }
      };

      recognition.onend = () => {
        if (sessionIdRef.current === currentSessionId) {
          stopListening();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      if (sessionIdRef.current === currentSessionId) {
        setIsListening(false);
        clearAllTimers();
        toast({
          title: "Erro ao ativar microfone",
          description: "Não foi possível abrir o microfone. Tente clicar novamente.",
          variant: "destructive",
        });
      }
    }
  }, [
    lang,
    silenceTimeoutMs,
    maxListeningDurationMs,
    clearAllTimers,
    stopListening,
    toast,
  ]);

  // Alterna com segurança entre ligar e desligar
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      sessionIdRef.current = 0;
      clearAllTimers();
      if (recognitionRef.current) {
        const oldRec = recognitionRef.current;
        oldRec.onstart = null;
        oldRec.onresult = null;
        oldRec.onerror = null;
        oldRec.onend = null;
        try {
          oldRec.abort();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
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
