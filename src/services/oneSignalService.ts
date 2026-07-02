import OneSignal from 'react-onesignal';

export class OneSignalService {
  private static instance: OneSignalService | null = null;
  private hasInitialized = false;

  private constructor() {}

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  /**
   * Initializes the OneSignal SDK.
   */
  public async initialize(appId: string): Promise<void> {
    if (this.hasInitialized) {
      return;
    }

    const isAllowedHost = 
      window.location.hostname === "online-biblia.vercel.app" || 
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1";

    if (!isAllowedHost) {
      console.warn('[OneSignal] Initialization bypassed on non-production host:', window.location.hostname);
      return;
    }

    // Check if already initialized by another script
    if ((window as any).OneSignalInitialized || (window as any).OneSignal?.initialized) {
      this.hasInitialized = true;
      console.log('[OneSignal] Detected already initialized instance on window.');
      return;
    }

    // Clean up any old, non-OneSignal Service Workers before initializing
    await this.cleanupOldServiceWorkers();

    // Prevent race conditions between index.html initialization and react-onesignal
    if ((window as any).OneSignalInitializing) {
      console.log('[OneSignal] Initialization is already in progress, waiting...');
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if ((window as any).OneSignalInitialized || (window as any).OneSignal?.initialized) {
          this.hasInitialized = true;
          return;
        }
      }
    }

    (window as any).OneSignalInitializing = true;

    try {
      console.log('[OneSignal] Initializing SDK via react-onesignal with App ID:', appId);
      await OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false, // Do not auto-register on load
        welcomeNotification: {
          disable: true
        },
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: 'sw.js'
      });
      if ((OneSignal as any).InAppMessages) {
        (OneSignal as any).InAppMessages.paused = true;
        console.log('[OneSignal] In-App Messages paused in service');
      }
      this.hasInitialized = true;
      (window as any).OneSignalInitialized = true;
      console.log('[OneSignal] SDK initialized successfully');
    } catch (error: any) {
      if (error && (error.message?.includes('already initialized') || error.includes?.('already initialized'))) {
        console.log('[OneSignal] SDK was already initialized (caught error safely)');
        this.hasInitialized = true;
        (window as any).OneSignalInitialized = true;
      } else {
        console.error('[OneSignal] Initialization error:', error);
      }
    } finally {
      (window as any).OneSignalInitializing = false;
    }
  }

  /**
   * Cleans up old, non-OneSignal Service Workers to prevent obsolete requests
   * to the deprecated push notification endpoints.
   */
  private async cleanupOldServiceWorkers(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          const activeWorker = registration.active || registration.installing || registration.waiting;
          const scriptUrl = activeWorker?.scriptURL || '';
          if (scriptUrl && !scriptUrl.toLowerCase().includes('onesignal') && !scriptUrl.toLowerCase().endsWith('sw.js')) {
            console.log('[OneSignal Cleanup] Unregistering old, non-OneSignal Service Worker:', scriptUrl);
            await registration.unregister();
          }
        }
      } catch (err) {
        console.warn('[OneSignal Cleanup] Error clearing old Service Workers:', err);
      }
    }
  }

  /**
   * Log in a user (external ID).
   */
  public async login(externalId: string): Promise<void> {
    if (!this.hasInitialized) return;
    try {
      await OneSignal.login(externalId);
      console.log('[OneSignal] Logged in with external ID:', externalId);
    } catch (error) {
      console.error('[OneSignal] Login error:', error);
    }
  }

  /**
   * Log out the user.
   */
  public async logout(): Promise<void> {
    if (!this.hasInitialized) return;
    try {
      await OneSignal.logout();
      console.log('[OneSignal] Logged out');
    } catch (error) {
      console.error('[OneSignal] Logout error:', error);
    }
  }

  /**
   * Adds/updates email subscription.
   */
  public async setEmail(email: string): Promise<void> {
    if (!this.hasInitialized) return;
    try {
      await OneSignal.User.addEmail(email);
      console.log('[OneSignal] Added email subscription:', email);
    } catch (error) {
      console.error('[OneSignal] Set email error:', error);
    }
  }

  /**
   * Adds/updates SMS subscription.
   */
  public async setSmsNumber(number: string): Promise<void> {
    if (!this.hasInitialized) return;
    try {
      await OneSignal.User.addSms(number);
      console.log('[OneSignal] Added SMS subscription:', number);
    } catch (error) {
      console.error('[OneSignal] Set SMS error:', error);
    }
  }

  /**
   * Manages user tags.
   */
  public async setTag(key: string, value: string): Promise<void> {
    if (!this.hasInitialized) return;
    try {
      await OneSignal.User.addTag(key, value);
      console.log('[OneSignal] Added tag:', key, '=', value);
    } catch (error) {
      console.error('[OneSignal] Set tag error:', error);
    }
  }

  /**
   * Removes a tag.
   */
  public async removeTag(key: string): Promise<void> {
    if (!this.hasInitialized) return;
    try {
      await OneSignal.User.removeTag(key);
      console.log('[OneSignal] Removed tag:', key);
    } catch (error) {
      console.error('[OneSignal] Remove tag error:', error);
    }
  }

  /**
   * Set log levels.
   */
  public setLogLevel(level: string): void {
    if (!this.hasInitialized) return;
    console.log('[OneSignal] Setting log level:', level);
    try {
      if (typeof (OneSignal as any).Debug?.setLogLevel === 'function') {
        (OneSignal as any).Debug.setLogLevel(level);
      } else if (typeof (OneSignal as any).log?.setLevel === 'function') {
        (OneSignal as any).log.setLevel(level);
      }
    } catch (error) {
      console.warn('[OneSignal] Could not set log level:', error);
    }
  }

  /**
   * Request Push Permission.
   */
  public async requestPermission(): Promise<void> {
    if (!this.hasInitialized) return;
    try {
      console.log('[OneSignal] Requesting push notification permission...');
      await OneSignal.Notifications.requestPermission();
    } catch (error) {
      console.error('[OneSignal] Request permission error:', error);
    }
  }

  /**
   * Returns if the user is currently subscribed to push notifications.
   */
  public isSubscribed(): boolean {
    if (!this.hasInitialized) return false;
    try {
      return OneSignal.User?.PushSubscription?.optedIn || false;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current push subscription ID.
   */
  public getSubscriptionId(): string | undefined {
    if (!this.hasInitialized) return undefined;
    try {
      return OneSignal.User?.PushSubscription?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Adds a push subscription listener.
   */
  public addSubscriptionListener(callback: (id: string | undefined, optedIn: boolean) => void): () => void {
    if (!this.hasInitialized) return () => {};
    const changeHandler = (event: any) => {
      console.log('[OneSignal] Push subscription change event:', event);
      callback(event.current?.id, event.current?.optedIn);
    };

    try {
      if (OneSignal.User?.PushSubscription) {
        OneSignal.User.PushSubscription.addEventListener('change', changeHandler);
      }
      return () => {
        try {
          if (OneSignal.User?.PushSubscription) {
            OneSignal.User.PushSubscription.removeEventListener('change', changeHandler);
          }
        } catch (e) {
          console.warn('[OneSignal] Failed to remove subscription listener:', e);
        }
      };
    } catch (error) {
      console.warn('[OneSignal] Failed to add subscription listener:', error);
      return () => {};
    }
  }
}

export const oneSignalService = OneSignalService.getInstance();
