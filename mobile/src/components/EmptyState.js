import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Friendly message for an empty list, never a blank screen (FR-BRW-08).
export default function EmptyState({ message, icon = 'calendar-blank-outline', testID }) {
  const theme = useTheme();
  return (
    <View style={styles.box} testID={testID}>
      <MaterialCommunityIcons name={icon} size={40} color={theme.colors.outline} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  text: { marginTop: 12, textAlign: 'center' },
});
