/**
 * Basic React Native App with WebView
 * Uses `react-native-webview` to display an in-app browser
 */

import React from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View, SafeAreaView, ActivityIndicator } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { WebView } from 'react-native-webview';
import useIterablePushNotification from './hooks/useIterablePushNotification/useIterablePushNotification';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const webviewRef = React.useRef(null);

  // Replace 'your-iterable-api-key' with your actual Iterable Mobile API key
  // Optional third parameter: user email (can also be set later via Iterable.setEmail())
  useIterablePushNotification(webviewRef, 'your-iterable-api-key');
  // With user email: useIterablePushNotification(webviewRef, 'your-api-key', 'user@example.com');

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.header}>
        <Text style={styles.title}>In-App Browser</Text>
      </View>
      <WebView
        source={{ uri: 'https://example.com' }}
        startInLoadingState={true}
        ref={webviewRef}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
