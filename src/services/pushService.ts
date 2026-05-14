
import { supabase } from "@/integrations/supabase/client";

/**
 * Utilitário para converter a chave pública VAPID de Base64 para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra o Service Worker e solicita permissão para Push Notifications
 */
export async function setupPushNotifications(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push Notifications não suportados neste navegador.');
    return;
  }

  try {
    // 1. Registro do SW
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registrado:', registration.scope);

    // 2. Pedir permissão
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permissão de notificação negada.');
      return;
    }

    // 3. Inscrição no Push Manager
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY não configurada.');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // 4. Salvar no Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        push_subscription: subscription as any,
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    console.log('Inscrição Push salva com sucesso.');
  } catch (err) {
    console.error('Erro ao configurar Push Notifications:', err);
  }
}

/**
 * Atualiza o timestamp de última atividade do usuário
 */
export async function updateLastActive(userId: string) {
  try {
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (err) {
    console.warn('Erro ao atualizar atividade:', err);
  }
}
