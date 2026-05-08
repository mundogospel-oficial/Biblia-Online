import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Settings, Check } from 'lucide-react';

const COOKIE_KEY = 'biblia-online-cookies-v1';

export const CookieConsent = () => {
  const [show, setShow] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    personalization: true
  });

  useEffect(() => {
    const consentLocal = localStorage.getItem(COOKIE_KEY);
    const cookieMatch = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY + '=([^;]+)'));
    
    if (!consentLocal && !cookieMatch) {
      setTimeout(() => setShow(true), 1500);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      all: true,
      essential: true,
      analytics: true,
      personalization: true,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const handleRejectNonEssential = () => {
    const consent = {
      all: false,
      essential: true,
      analytics: false,
      personalization: false,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const handleSavePreferences = () => {
    const consent = {
      ...preferences,
      all: preferences.analytics && preferences.personalization,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const saveConsent = (data: any) => {
    // Save to localStorage
    localStorage.setItem(COOKIE_KEY, JSON.stringify(data));
    
    // Also set a real cookie for 365 days
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = COOKIE_KEY + "=" + (JSON.stringify(data) || "")  + expires + "; path=/; SameSite=Lax";
    
    setShow(false);
    setIsConfiguring(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="mx-auto max-w-4xl glass-card border-white/10 shadow-2xl overflow-hidden rounded-[2rem]">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-accent" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-foreground">Privacidade e Cookies (LGPD)</h2>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Visando a máxima transparência e conformidade legal, informamos que utilizamos cookies para oferecer uma experiência personalizada, otimizar a navegação e analisar o tráfego do site. Respeitamos os seus direitos conforme a <span className="font-semibold text-foreground">Lei Geral de Proteção de Dados (Lei 13.709/2018)</span> e garantimos a você o total controle sobre as suas preferências de privacidade.
                  </p>
                </div>
                
                {!isConfiguring ? (
                  <div className="flex flex-col gap-2 w-full md:w-auto min-w-[200px]">
                    <button 
                      onClick={handleAcceptAll}
                      className="w-full rounded-xl bg-accent py-3 px-6 text-sm font-bold text-accent-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Aceitar Todos
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleRejectNonEssential}
                        className="rounded-xl bg-secondary/50 py-2.5 px-4 text-xs font-medium text-foreground transition-all hover:bg-secondary"
                      >
                        Rejeitar Não-Essenciais
                      </button>
                      <button 
                        onClick={() => setIsConfiguring(true)}
                        className="rounded-xl border border-white/10 bg-transparent py-2.5 px-4 text-xs font-medium text-foreground transition-all hover:bg-white/5"
                      >
                        Configurar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full md:w-[350px] space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Personalizar</span>
                      <button onClick={() => setIsConfiguring(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">Essenciais</p>
                          <p className="text-[10px] text-muted-foreground">Necessários para o funcionamento</p>
                        </div>
                        <Check className="h-4 w-4 text-accent" />
                      </div>
                      
                      <div className="flex items-center justify-between group cursor-pointer" onClick={() => setPreferences(p => ({...p, analytics: !p.analytics}))}>
                        <div>
                          <p className="text-xs font-bold">Análise e Performance</p>
                          <p className="text-[10px] text-muted-foreground">Melhoram nossa entrega</p>
                        </div>
                        <div className={`h-4 w-4 rounded border ${preferences.analytics ? 'bg-accent border-accent' : 'border-white/20'} flex items-center justify-center`}>
                          {preferences.analytics && <Check className="h-3 w-3 text-accent-foreground" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between group cursor-pointer" onClick={() => setPreferences(p => ({...p, personalization: !p.personalization}))}>
                        <div>
                          <p className="text-xs font-bold">Funcionais</p>
                          <p className="text-[10px] text-muted-foreground">Lembram suas preferências</p>
                        </div>
                        <div className={`h-4 w-4 rounded border ${preferences.personalization ? 'bg-accent border-accent' : 'border-white/20'} flex items-center justify-center`}>
                          {preferences.personalization && <Check className="h-3 w-3 text-accent-foreground" />}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSavePreferences}
                      className="w-full rounded-xl bg-accent/20 py-2.5 text-xs font-bold text-accent transition-all hover:bg-accent hover:text-accent-foreground"
                    >
                      Salvar Preferências
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
