import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

// A plain-words error with what to do next (NFR-USA-05). Pass onRetry to get a Retry button
// (screens that load data show this on failure).
export default function ErrorBanner({ message, onRetry, testID }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <View
      style={[styles.box, { backgroundColor: theme.colors.errorContainer }]}
      accessibilityRole="alert"
      testID={testID}
    >
      <Text style={{ color: theme.colors.onErrorContainer }}>{message}</Text>
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
