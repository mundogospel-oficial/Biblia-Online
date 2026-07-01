import { oneSignalService } from "./oneSignalService";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registers OneSignal with the logged-in user and requests push notification permission
 */
export async function setupPushNotifications(userId: string) {
  try {
    console.log('[OneSignal] Setting up notifications for user:', userId);
    
    // 1. Log in the user to OneSignal using their UUID
    await oneSignalService.login(userId);
    
    // 2. Request push permission
    await oneSignalService.requestPermission();
    
    console.log('[OneSignal] Push notifications setup completed.');
  } catch (err) {
    console.error('[OneSignal] Error during push notification setup:', err);
  }
}

/**
 * Updates the last active timestamp of the user
 */
export async function updateLastActive(userId: string) {
  try {
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() as any })
      .eq('id', userId);
  } catch (err) {
    console.warn('[OneSignal] Error updating user activity timestamp:', err);
  }
}
