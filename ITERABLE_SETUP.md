# Iterable Push Notifications Setup Guide

This document outlines the steps completed for migrating from OneSignal to Iterable push notifications, and what you need to do to complete the setup.

## 🔴 Critical Configuration Note

**Package Name vs Integration Name Mismatch:**
- Your Android app package ID: `com.iterable_rn_project`
- Your Iterable integration name: `com_iterable_staging`

By default, the Iterable SDK looks for a push integration with the same name as your app's package ID. Since yours differs, you may need to uncomment this line in `useIterablePushNotification.ts`:
```typescript
config.pushIntegrationName = 'com_iterable_staging';
```

If your Android push notifications don't work, this is likely the cause.

## ⚠️ Important Differences from OneSignal

**Iterable SDK Architecture:**
Iterable's React Native SDK works fundamentally differently from OneSignal:

1. **No Foreground Notification Event** ❌
   - OneSignal: `addEventListener('foregroundWillDisplay')` fires when notification is received
   - Iterable: **NO JavaScript callback for foreground notifications**
   - The native iOS/Android SDK handles display automatically
   - Your Angular app **will NOT receive** the `notificationShownInFG` event anymore
   - If you need foreground detection, you must implement native code (see below)

2. **Notification Clicks Use Config Callbacks** ✅
   - OneSignal: Runtime event listeners (`addEventListener('click')`)
   - Iterable: Configuration-time callbacks (`config.urlHandler` and `config.customActionHandler`)
   - The `notificationClicked` CustomEvent **WILL still work** for your Angular app

3. **No Built-in Permission Methods** 📋
   - OneSignal: `requestPermission()` and `getPermissionAsync()` methods
   - Iterable: Permissions handled at native level (iOS AppDelegate, Android Manifest)
   - Permissions are already configured in the native code

4. **User Identity Required** 🔑
   - You MUST call `Iterable.setEmail('user@example.com')` or `Iterable.setUserId('user123')`
   - Without this, the device won't register for push notifications
   - Can be set in the hook (third parameter) or from your webview

**Migration Impact on Your Angular App:**

| Event | OneSignal | Iterable | Still Works? |
|-------|-----------|----------|--------------|
| `notificationShownInFG` | ✅ Fired | ❌ Not fired | **NO** - Remove this listener |
| `notificationClicked` | ✅ Fired | ✅ Fired | **YES** - Keep this listener |

## ✅ What Has Been Completed

### 1. Package Installation
- Installed `@iterable/react-native-sdk` package
- All dependencies are now in `package.json`

### 2. iOS Configuration
- **Podfile**: Updated to use dynamic framework linkage (required by Iterable SDK)
- **AppDelegate.swift**:
  - Added `UserNotifications` framework import
  - Added `UNUserNotificationCenterDelegate` protocol
  - Configured push notification delegates
  - Set up foreground notification handling
- **Info.plist**: Added `UIBackgroundModes` with `remote-notification` for background push

### 3. Android Configuration
- **build.gradle (project level)**: Added Firebase Google Services plugin classpath
- **build.gradle (app level)**:
  - Applied Google Services plugin
  - Added Firebase BOM (Bill of Materials) v33.8.0
  - Added Firebase Messaging dependency
  - Added Iterable Android SDK v3.5.3
- **AndroidManifest.xml**:
  - Added `POST_NOTIFICATIONS` permission (required for Android 13+)
  - Added intent filters for notification handling
- **MainApplication.kt**:
  - Added `IterableApi.setContext(this)` initialization (required by official guide for SDK 1.1.0+)

### 4. React Native Code
- **Created**: `hooks/useIterablePushNotification/useIterablePushNotification.ts`
  - Uses correct Iterable SDK API (config callbacks, not event listeners)
  - Handles notification clicks via `urlHandler` and `customActionHandler`
  - **Does NOT handle foreground notifications** (Iterable limitation)
  - Injects `notificationClicked` CustomEvent into webview
  - Includes `getLastPushPayload()` to handle cold start from notification
- **Updated**: `App.tsx` to use the new Iterable hook instead of OneSignal

## 🔧 What You Need to Do

### Step 1: Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### Step 2: Add Firebase Configuration Files

#### For Android:
1. Go to your Firebase Console (https://console.firebase.google.com/)
2. Select your project (or create one if you haven't)
3. Go to Project Settings > Your apps > Android app
4. Download the `google-services.json` file
5. Place it here: `android/app/google-services.json`

**Important**: The package name in Firebase must match: `com.iterable_rn_project`

#### For iOS:
1. In the same Firebase Console
2. Go to Project Settings > Your apps > iOS app
3. Download the `GoogleService-Info.plist` file
4. Place it here: `ios/iterable_rn_project/GoogleService-Info.plist`
5. **Also add this file to your Xcode project**:
   - Open `ios/iterable_rn_project.xcworkspace` in Xcode
   - Drag `GoogleService-Info.plist` into the project navigator
   - Make sure "Copy items if needed" is checked
   - Select your target

**Important**: The bundle ID in Firebase must match: `com.iterable.org` (as mentioned in your setup)

### Step 3: Configure Iterable in Your Code

Update `App.tsx` line 16 with your actual Iterable API key:
```typescript
useIterablePushNotification(webviewRef, 'YOUR_ACTUAL_ITERABLE_API_KEY');
```

You can find your API key in Iterable:
1. Go to https://app.iterable.com/
2. Navigate to Integrations > API Keys
3. Copy your Mobile API Key

### Step 4: Set Up Iterable Mobile Apps (if not done already)

#### Android App (`com_iterable_staging`):
1. In Iterable, go to Integrations > Mobile Apps
2. Click on your Android app (`com_iterable_staging`)
3. Under "Configure Firebase integration", upload the same `google-services.json` file
4. Save the configuration

#### iOS App:
1. In Iterable, go to Integrations > Mobile Apps
2. Create or select your iOS app
3. Upload your APNs certificate (.p12 file) or authentication key (.p8 file)
4. Enter your Bundle ID: `com.iterable.org`
5. Save the configuration

### Step 5: Set User Email/ID

Before push notifications work, you need to set a user email or user ID in Iterable. Add this to your code where appropriate (usually after user login):

```typescript
import { Iterable } from '@iterable/react-native-sdk';

// Set user email
Iterable.setEmail('user@example.com');

// OR set user ID
Iterable.setUserId('user123');
```

You can add this in your `useIterablePushNotification` hook or wherever you handle user authentication in your webview.

### Step 6: Enable Push Notifications in Xcode (iOS)

1. Open `ios/iterable_rn_project.xcworkspace` in Xcode
2. Select your project in the navigator
3. Select your target
4. Go to "Signing & Capabilities" tab
5. Click "+ Capability"
6. Add "Push Notifications"
7. Add "Background Modes" (if not already present)
   - Check "Remote notifications"

### Step 7: Test Your Setup

#### iOS:
```bash
npm run ios
```

#### Android:
```bash
npm run android
```

**Note**: Push notifications only work on physical devices, not on simulators/emulators.

## 🔄 How It Works (DIFFERENT from OneSignal)

**⚠️ IMPORTANT: This is NOT the same as OneSignal!**

1. **Foreground Notifications**: ❌ **NOT SUPPORTED**
   - Iterable's React Native SDK **does not provide** a JavaScript callback for foreground notifications
   - The `notificationShownInFG` CustomEvent **will NOT fire**
   - Your Angular app **must remove** this event listener
   - Notifications are displayed by the native OS automatically
   - If you need foreground detection, you must implement native code

2. **Notification Clicks**: ✅ **SUPPORTED** - When a user taps on a notification, it dispatches:
   ```javascript
   window.dispatchEvent(new CustomEvent('notificationClicked', { detail: {...} }))
   ```

Your Angular app **must update** its event listeners:

```javascript
// ❌ REMOVE THIS - It will never fire with Iterable
window.addEventListener('notificationShownInFG', (event) => {
  console.log('Foreground notification:', event.detail);
});

// ✅ KEEP THIS - It still works with Iterable
window.addEventListener('notificationClicked', (event) => {
  console.log('Notification clicked:', event.detail);
});
```

### If You Need Foreground Notification Detection

If your Angular app requires knowing when a notification arrives in foreground, you have two options:

**Option 1: Use a complementary library** (recommended for React Native)
- Install `@notifee/react-native` or `react-native-push-notification` alongside Iterable
- These libraries can detect foreground notifications and emit events to JavaScript

**Option 2: Implement native code** (iOS example in `AppDelegate.swift`):
```swift
// Already implemented in your AppDelegate.swift
func userNotificationCenter(
  _ center: UNUserNotificationCenter,
  willPresent notification: UNNotification,
  withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
) {
  // Add custom code here to emit event to React Native using RCTEventEmitter
  // This requires creating a native module bridge
  completionHandler([.banner, .sound, .badge])
}
```

## 📝 SDK Method Mapping Reference

| Feature | OneSignal | Iterable |
|---------|-----------|----------|
| **Initialization** | `OneSignal.initialize(appID)` | `Iterable.initialize(apiKey, config)` |
| **Foreground Event** | `addEventListener('foregroundWillDisplay')` | ❌ **Not available** |
| **Click Event** | `addEventListener('click')` | `config.urlHandler` + `config.customActionHandler` |
| **Request Permission** | `requestPermission()` | ❌ Handle in native code |
| **Check Permission** | `getPermissionAsync()` | ❌ Handle in native code |
| **Set User** | Auto from device | **Required**: `setEmail()` or `setUserId()` |
| **Integration Name** | App ID | `pushIntegrationName` config |

## 🐛 Troubleshooting

### iOS
- Make sure you've run `pod install` after installing the package
- Verify Push Notifications capability is enabled in Xcode
- Check that your APNs certificate/key is properly configured in Iterable
- Make sure you're testing on a physical device, not simulator

### Android
- Verify `google-services.json` is in the correct location
- Check that the package name matches in Firebase, your app, and Iterable
- Make sure you've accepted notification permissions on Android 13+
- Test on a physical device

### Both Platforms
- Ensure you've called `Iterable.setEmail()` or `Iterable.setUserId()` before sending test notifications
- Check Iterable dashboard to confirm the device is registered
- Verify your API key is correct

## 📚 Additional Resources

- [Iterable React Native SDK Documentation](https://github.com/Iterable/react-native-sdk)
- [Iterable Support: Installing React Native SDK](https://support.iterable.com/hc/en-us/articles/360045714132)
- [Firebase Console](https://console.firebase.google.com/)
- [Iterable Dashboard](https://app.iterable.com/)

## 🆘 Need Help?

If you encounter issues:
1. Check the console logs for any error messages
2. Verify all configuration files are in the correct locations
3. Ensure your Firebase and Iterable setups are complete
4. Test on a physical device (push notifications don't work on simulators/emulators)
