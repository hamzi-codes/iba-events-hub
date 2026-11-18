import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

// A plain-words message with what to do next (NFR-USA-05). Pass onRetry to get a Retry
// button (screens that load data show this on failure). tone="info" gives the calm blue
// version used for good news, e.g. "Your email is verified".
export default function ErrorBanner({ message, onRetry, tone = 'error', testID }) {
  const theme = useTheme();
  if (!message) return null;
  const isError = tone === 'error';
  return (
    <View
      style={[styles.box, { backgroundColor: isError ? theme.colors.errorContainer : '#E3EEF9' }]}
      accessibilityRole={isError ? 'alert' : undefined}
      testID={testID}
    >
      <Text style={{ color: isError ? theme.colors.onErrorContainer : '#12345C' }}>{message}</Text>
      {onRetry ? (
        <Button compact onPress={onRetry} style={styles.retry} textColor={theme.colors.error}>
          Retry
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 12, borderRadius: 8, marginBottom: 12 },
  retry: { alignSelf: 'flex-start', marginTop: 4 },
});
