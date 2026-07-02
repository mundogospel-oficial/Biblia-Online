import { oneSignalService } from "./oneSignalService";

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

