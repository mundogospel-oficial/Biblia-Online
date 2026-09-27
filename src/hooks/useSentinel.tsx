import React, { useEffect, useRef, useState, useCallback } from "react";
import SentinelCore from "../lib/security/sentinel-security.js";
import { getLocalBan, reportBanToSupabase, checkIsBannedInSupabase, SecurityBanRecord } from "@/services/securityService";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { SentinelSecurityOverlay } from "@/components/SentinelSecurityOverlay";
import { BotChallengeModal } from "@/components/BotChallengeModal";
import { toast } from "sonner";

export function useSentinel(config: any = {}) {
  const sentinelRef = useRef<any>(null);

  const [isBlocked, setIsBlocked] = useState<boolean>(() => {
    const localBan = getLocalBan();
    return !!localBan;
  });

  const [isBotBlocked, setIsBotBlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sentinel_bot_blocked") === "true";
    }
    return false;
  });

  const [blockInfo, setBlockInfo] = useState<SecurityBanRecord | null>(() => {
    return getLocalBan();
  });

  const [isExtensionDetected, setIsExtensionDetected] = useState<boolean>(false);
  const [extensionReasons, setExtensionReasons] = useState<string[]>([]);

  const handleUnblockBot = useCallback((token: string) => {
    console.log("[Sentinel] Desbloqueio de bot concluído com sucesso via Cloudflare:", token);
    setIsBotBlocked(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sentinel_bot_blocked");
    }
    sentinelRef.current?.resetBotScore?.();
    toast.success("Verificação concluída! O bloqueio de bot foi removido com sucesso.");
  }, []);

  const handleBlock = useCallback(async (info: any) => {
    setIsBlocked(true);
    const record: SecurityBanRecord = {
      fingerprint: info.fingerprint || "FP_HASH",
      reason: info.blockReason || "Acesso bloqueado por violação de segurança.",
      errorCode: info.errorCode || "BAN_SENTINEL_SECURITY_0x800403",
      score: info.score || 100,
      timestamp: new Date().toISOString()
    };
    setBlockInfo(record);

    // Report to Supabase
    await reportBanToSupabase(record);
  }, []);

  // Checagem ativa na tabela de banimentos do Supabase ao iniciar
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let mounted = true;

    const verifySupabaseBan = async () => {
      try {
        const fp = sentinelRef.current?.lastFingerprint || sentinelRef.current?.fingerprint?.lastHash;
        const result = await checkIsBannedInSupabase(fp);

        if (!mounted) return;

        if (result.isBanned && result.record) {
          setIsBlocked(true);
          setBlockInfo(result.record);
        } else if (!result.isBanned) {
          // Se a verificação confirmou que o IP foi removido da tabela do Supabase, libera o app!
          setIsBlocked(false);
          setBlockInfo(null);
        }
      } catch (err) {
        console.warn("Erro ao checar banimento no Supabase:", err);
      }
    };

    verifySupabaseBan();
    // Intervalo de 5 minutos (300.000 ms) para verificar se o banimento foi removido do Supabase sem recarregar a página a todo momento
    const interval = setInterval(verifySupabaseBan, 300000);

    const handleFocus = () => {
      verifySupabaseBan();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Escuta alterações em tempo real do estado de bloqueio
  useEffect(() => {
    const handleBlockChange = (e: any) => {
      const { isBlocked: blocked, record } = e.detail || {};
      setIsBlocked(!!blocked);
      setBlockInfo(record || null);
    };

    window.addEventListener("sentinel-block-change", handleBlockChange);

    if (typeof window !== "undefined") {
      // Comando manual para ativar o bloqueio e registrar no Supabase
      (window as any).testSentinelBlock = (reason = "Tentativa de invasão ou script suspeito detectado pelo Sentinel") => {
        const testRecord: SecurityBanRecord = {
          fingerprint: sentinelRef.current?.lastFingerprint || "HASH_TEST_0x" + Math.floor(Math.random() * 0xFFFFFF).toString(16),
          reason,
          errorCode: "BAN_SENTINEL_SECURITY_0x800403",
          score: 100,
          timestamp: new Date().toISOString()
        };
        reportBanToSupabase(testRecord);
        return "Bloqueio de segurança ativado.";
      };
      (window as any).triggerSentinelBlock = (window as any).testSentinelBlock;

      (window as any).triggerBotBlock = () => {
        setIsBotBlocked(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("sentinel_bot_blocked", "true");
        }
        return "Bloqueio de bot ativado para teste. Verifique o modal Cloudflare.";
      };
      (window as any).unblockBot = () => {
        handleUnblockBot("manual_token");
        return "Bloqueio de bot removido com sucesso.";
      };
    }

    return () => {
      window.removeEventListener("sentinel-block-change", handleBlockChange);
    };
  }, [handleUnblockBot]);

  useEffect(() => {
    if (!sentinelRef.current) {
      sentinelRef.current = new SentinelCore({
        debug: process.env.NODE_ENV === "development",
        reportEndpoint: "/api/security/report",
        action: "block",
        onBlocked: (info: any) => {
          handleBlock(info);
        },
        onBotConfirmed: (info: any) => {
          console.warn("[Sentinel] Atividade de bot detectada. Exibindo desafio Cloudflare Turnstile:", info);
          setIsBotBlocked(true);
          if (typeof window !== "undefined") {
            localStorage.setItem("sentinel_bot_blocked", "true");
          }
        },
        onExtensionDetected: (extCheck: any) => {
          if (extCheck.detected) {
            setIsExtensionDetected(true);
            setExtensionReasons(extCheck.reasons || []);
          } else {
            setIsExtensionDetected(false);
          }
        },
        ...config,
      });

      sentinelRef.current.init();
    }

    return () => {
      // sentinelRef.current?.destroy();
    };
  }, [config, handleBlock]);

  const checkRisk = useCallback(async () => {
    if (!sentinelRef.current) return { score: 0, level: "safe" };
    return await sentinelRef.current._evaluate();
  }, []);

  const checkRateLimit = useCallback((action: string) => {
    return sentinelRef.current?.checkRateLimit(action) || { allowed: true };
  }, []);

  const getStatus = useCallback(() => {
    return sentinelRef.current?.getStatus();
  }, []);

  const SentinelOverlay = useCallback(() => {
    return (
      <>
        <SentinelSecurityOverlay
          isBlocked={isBlocked}
          blockReason={blockInfo?.reason}
          errorCode={blockInfo?.errorCode}
          fingerprint={blockInfo?.fingerprint}
          isExtensionDetected={isExtensionDetected}
          extensionReasons={extensionReasons}
          onReload={() => window.location.reload()}
        />
        <BotChallengeModal
          isOpen={!isBlocked && isBotBlocked}
          onVerified={handleUnblockBot}
        />
      </>
    );
  }, [isBlocked, isBotBlocked, blockInfo, isExtensionDetected, extensionReasons, handleUnblockBot]);

  return {
    sentinel: sentinelRef.current,
    isBlocked,
    isBotBlocked,
    handleUnblockBot,
    blockInfo,
    isExtensionDetected,
    extensionReasons,
    checkRisk,
    checkRateLimit,
    getStatus,
    SentinelOverlay,
  };
}
