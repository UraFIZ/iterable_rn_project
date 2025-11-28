// useIterablePushNotification.ts
// Iterable React Native SDK implementation mirroring OneSignal pattern
//
// Key differences from OneSignal:
// - No foreground notification display event (handled by native SDK)
// - Notification clicks handled via config callbacks (not event listeners)
// - Permissions handled at native level (iOS AppDelegate, Android Manifest)

import {useEffect, useRef} from 'react';
import {
  Iterable,
  IterableConfig,
  IterableAction,
  IterableActionContext,
} from '@iterable/react-native-sdk';

/**
 * Store webview ref globally for use in config callbacks
 * (Iterable requires handlers to be set at initialization time)
 */
let globalWebviewRef: React.MutableRefObject<any> | null = null;

/**
 * Creates IterableConfig with notification handlers
 * These handlers serve as the equivalent to OneSignal's event listeners
 */
const createIterableConfig = (): IterableConfig => {
  const config = new IterableConfig();

  // Enable automatic push token registration
  config.autoPushRegistration = true;

  // Set to match your Iterable mobile app integration name (Android: com_iterable_staging)
  // By default, SDK uses your app's package/bundle ID
  // Uncomment the line below if your integration name differs from package ID
  // config.pushIntegrationName = 'com_iterable_staging';

  // Required for handling URLs (add protocols your app uses)
  config.allowedProtocols = ['http', 'https', 'itbl', 'action'];

  /**
   * URL Handler - Equivalent to OneSignal's 'click' event for URL-based notifications
   * Called when user clicks a notification containing a URL or deep link
   */
  config.urlHandler = (url: string, context: IterableActionContext): boolean => {
    if (context.source === 'push' && globalWebviewRef?.current) {
      const notificationData = {
        url,
        source: context.source,
        action: context.action,
      };

      // Inject notification click event into webview
      globalWebviewRef.current.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('notificationClicked', { detail: ${JSON.stringify(
          notificationData,
        )} }));`,
      );

      console.log('[Iterable] Push notification clicked with URL:', url);
      return true; // Indicate we handled the URL
    }
    return false; // Let system handle if not from push or no webview
  };

  /**
   * Custom Action Handler - For action:// URLs in notifications
   * Also serves as notification click handler for custom actions
   */
  config.customActionHandler = (
    action: IterableAction,
    context: IterableActionContext,
  ): boolean => {
    if (context.source === 'push' && globalWebviewRef?.current) {
      const notificationData = {
        actionType: action.type,
        actionData: action.data,
        source: context.source,
      };

      // Inject notification click event into webview
      globalWebviewRef.current.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('notificationClicked', { detail: ${JSON.stringify(
          notificationData,
        )} }));`,
      );

      console.log('[Iterable] Custom action triggered:', action.type);
      return true;
    }
    return false;
  };

  return config;
};

/**
 * Check for push payload on app launch/resume
 * This helps capture notifications that opened the app
 */
const checkLastPushPayload = async (
  webviewRef: React.MutableRefObject<any>,
) => {
  try {
    const payload = await Iterable.getLastPushPayload();
    if (payload && webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('notificationClicked', { detail: ${JSON.stringify(
          payload,
        )} }));`,
      );
      console.log('[Iterable] Last push payload:', payload);
    }
  } catch (error) {
    console.error('[Iterable] Error getting last push payload:', error);
  }
};

/**
 * Main hook for Iterable push notifications
 * Mirrors the OneSignal usePushNotification hook pattern
 *
 * @param webviewRef - Reference to the WebView component
 * @param apiKey - Iterable Mobile API key from Iterable dashboard
 * @param userEmail - Optional: User email for Iterable identification
 *
 * NOTE: Foreground notification handling
 * Unlike OneSignal, Iterable does NOT provide a JavaScript-level callback
 * for foreground notification display. The native iOS/Android SDK handles
 * display automatically. If you need custom foreground handling, you must
 * implement it in native code (iOS: UNUserNotificationCenterDelegate).
 */
const useIterablePushNotification = (
  webviewRef: React.MutableRefObject<any>,
  apiKey: string,
  userEmail?: string,
) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Store webview ref globally for config callbacks
    globalWebviewRef = webviewRef;

    const initializeIterable = async () => {
      if (isInitialized.current) {
        return;
      }

      try {
        // Create config with notification handlers
        // These must be set BEFORE initialization
        const config = createIterableConfig();

        // Initialize the Iterable SDK
        Iterable.initialize(apiKey, config);
        isInitialized.current = true;

        console.log('[Iterable] SDK initialized successfully');

        // Set user identity (required for push registration with autoPushRegistration)
        // Note: You should call this from your app when user logs in
        if (userEmail) {
          Iterable.setEmail(userEmail);
        }

        // Check if app was opened from a notification
        await checkLastPushPayload(webviewRef);
      } catch (error) {
        console.error('[Iterable] Initialization error:', error);
      }
    };

    initializeIterable();

    // Cleanup
    return () => {
      globalWebviewRef = null;
    };
  }, [webviewRef, apiKey, userEmail]);
};

export default useIterablePushNotification;
