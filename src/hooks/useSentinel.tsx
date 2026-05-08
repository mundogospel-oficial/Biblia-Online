import { useEffect, useRef, useCallback } from 'react';
import SentinelCore from '../lib/security/sentinel-security.js';

export function useSentinel(config = {}) {
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize once
    if (!sentinelRef.current) {
      sentinelRef.current = new SentinelCore({
        debug: process.env.NODE_ENV === 'development',
        reportEndpoint: '/api/security/report',
        action: 'monitor', // We want to manually handle blocking based on score
        ...config,
      });
      sentinelRef.current.init();
    }

    return () => {
      // Basic cleanup if needed
      // sentinelRef.current?.destroy();
    };
  }, [config]);

  const checkRisk = useCallback(async () => {
    if (!sentinelRef.current) return { score: 0, level: 'safe' };
    return await sentinelRef.current._evaluate();
  }, []);

  const checkRateLimit = useCallback((action: string) => {
    return sentinelRef.current?.checkRateLimit(action) || { allowed: true };
  }, []);

  const getStatus = useCallback(() => {
    return sentinelRef.current?.getStatus();
  }, []);

  return { sentinel: sentinelRef.current, checkRisk, checkRateLimit, getStatus };
}
