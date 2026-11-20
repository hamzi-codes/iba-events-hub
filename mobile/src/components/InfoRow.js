import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

// "Label   value" line used on the detail and review screens.
export default function InfoRow({ label, value, testID }) {
  const theme = useTheme();
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.row} testID={testID}>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 4 },
  label: { width: 104 },
  value: { flex: 1 },
});
