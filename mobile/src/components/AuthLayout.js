import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Shared frame for the account screens. With headerTitle it shows the wireframe header bar
// (back arrow and centred title, as on Create account and Verify your email). Without it
// (Login) the screen has no bar. The form scrolls when the keyboard is open, so it works
// on widths 320 to 430.
export default function AuthLayout({ headerTitle, onBack, children }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {headerTitle ? (
        <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.background }}>
          {onBack ? <Appbar.BackAction onPress={onBack} /> : null}
          <Appbar.Content title={headerTitle} />
          {onBack ? <View style={styles.headerBalance} /> : null}
        </Appbar.Header>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerTitle ? 16 : insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  headerBalance: { width: 48 },
});
