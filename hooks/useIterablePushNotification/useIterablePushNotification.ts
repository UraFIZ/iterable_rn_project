// webviewRef - arg
// apiKey - arg

import {useEffect} from 'react';
import {
  Iterable,
  IterableConfig,
  IterableAction,
  IterableActionContext,
} from '@iterable/react-native-sdk';

const handleForegroundPN = (webviewRef: any) => {
  // Set custom action handler to intercept foreground notifications
  const config = new IterableConfig();
  config.inAppDisplayInterval = 1.0;

  // Listen to push notification received in foreground
  Iterable.setInAppShowResponse((message: any) => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('notificationShownInFG', { detail: ${JSON.stringify(
          message,
        )} }));`,
      );
    }
  });
};

const handleOpenedPN = (webviewRef: any) => {
  // Set custom action handler for notification clicks
  Iterable.setCustomActionHandler(
    (action: IterableAction, actionContext: IterableActionContext) => {
      if (webviewRef.current) {
        const notificationData = {
          action: action,
          context: actionContext,
        };
        webviewRef.current.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('notificationClicked', { detail: ${JSON.stringify(
            notificationData,
          )} }));`,
        );
      }
      return true; // Return true to indicate we handled the action
    },
  );
};

const requestPNPermission = async () => {
  try {
    // Request push notification permission
    await Iterable.requestPushPermission();
    return true;
  } catch (error) {
    console.error('Error requesting push permission:', error);
    return false;
  }
};

const useIterablePushNotification = (webviewRef: any, apiKey: string) => {
  useEffect(() => {
    // Initialize Iterable SDK
    const config = new IterableConfig();
    config.pushIntegrationName = 'iterable-react-native-sdk';
    config.autoPushRegistration = true;

    Iterable.initialize(apiKey, config);

    // Request permission and set up handlers
    requestPNPermission().then(granted => {
      if (granted) {
        handleForegroundPN(webviewRef);
        handleOpenedPN(webviewRef);
      }
    });
  }, [webviewRef, apiKey]);
};

export default useIterablePushNotification;
