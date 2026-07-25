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
      errorCode: info.errorCode || "ERR_SENTINEL_SECURITY_0x800403",
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
        } else {
          // Se o IP/Usuário foi removido da tabela do Supabase, libera o app!
          setIsBlocked(false);
          setBlockInfo(null);
        }
      } catch (err) {
        console.warn("Erro ao checar banimento no Supabase:", err);
      }
    };

    verifySupabaseBan();

    return () => {
      mounted = false;
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
