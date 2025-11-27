// webviewRef -arg
// appID -arg

import {useEffect} from 'react';
import {OneSignal} from 'react-native-onesignal';

const handleForgroundPN = (webviewRef: any) => {
  OneSignal.Notifications.addEventListener(
    'foregroundWillDisplay',
    function (notification) {
      webviewRef.current.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('notificationShownInFG', { detail: ${JSON.stringify(
          notification,
        )} }));`,
      );
    },
  );
};
const handleOpenedPN = (webviewRef: any) => {
  OneSignal.Notifications.addEventListener('click', function (notification) {
    webviewRef.current.injectJavaScript(
      `window.dispatchEvent(new CustomEvent('notificationClicked', { detail: ${JSON.stringify(
        notification,
      )} }));`,
    );
  });
};
const requestPNPermission = async () => {
  try {
    const permission = await OneSignal.Notifications.getPermissionAsync();
    if (!permission) {
      return await OneSignal.Notifications.requestPermission(true);
    }
    return true;
  } catch (error) {
    return false;
  }
};

const usePushNotification = (webviewRef: any, appID: string) => {
  useEffect(() => {
    OneSignal.initialize(appID);
    requestPNPermission().then(granted => {
      if (granted) {
        handleForgroundPN(webviewRef);
        handleOpenedPN(webviewRef);
      }
    });
  }, [webviewRef, appID]);
};
export default usePushNotification;
