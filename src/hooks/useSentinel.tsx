import React, { useEffect, useRef, useState, useCallback } from "react";
import SentinelCore from "../lib/security/sentinel-security.js";
import { getLocalBan, reportBanToSupabase, checkIsBannedInSupabase, SecurityBanRecord } from "@/services/securityService";
import { SentinelSecurityOverlay } from "@/components/SentinelSecurityOverlay";

export function useSentinel(config: any = {}) {
  const sentinelRef = useRef<any>(null);

  const [isBlocked, setIsBlocked] = useState<boolean>(() => {
    const localBan = getLocalBan();
    return !!localBan;
  });

  const [blockInfo, setBlockInfo] = useState<SecurityBanRecord | null>(() => {
    return getLocalBan();
  });

  const [isExtensionDetected, setIsExtensionDetected] = useState<boolean>(false);
  const [extensionReasons, setExtensionReasons] = useState<string[]>([]);

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
    // Utiliza intervalo seguro de 30s para evitar erro 429 (Too Many Requests / WAF Challenge)
    const interval = setInterval(verifySupabaseBan, 30000);

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
        return "🚨 Sentinel: Bloqueio ativado e registrado no Supabase!";
      };
      (window as any).triggerSentinelBlock = (window as any).testSentinelBlock;
    }

    return () => {
      window.removeEventListener("sentinel-block-change", handleBlockChange);
    };
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) {
      sentinelRef.current = new SentinelCore({
        debug: process.env.NODE_ENV === "development",
        reportEndpoint: "/api/security/report",
        action: "block",
        onBlocked: (info: any) => {
          handleBlock(info);
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
      <SentinelSecurityOverlay
        isBlocked={isBlocked}
        blockReason={blockInfo?.reason}
        errorCode={blockInfo?.errorCode}
        fingerprint={blockInfo?.fingerprint}
        isExtensionDetected={isExtensionDetected}
        extensionReasons={extensionReasons}
        onReload={() => window.location.reload()}
      />
    );
  }, [isBlocked, blockInfo, isExtensionDetected, extensionReasons]);

  return {
    sentinel: sentinelRef.current,
    checkRisk,
    checkRateLimit,
    getStatus,
    isBlocked,
    isExtensionDetected,
    SentinelOverlay,
  };
}
