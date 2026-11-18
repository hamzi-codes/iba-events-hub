import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

// Small label for an event status. The word is always shown, so colour is never the only clue.
const STYLES = {
  PENDING: { label: 'Pending', bg: '#FFF4D6', fg: '#5E4500' },
  CHANGES_REQUESTED: { label: 'Changes requested', bg: '#FFE5D0', fg: '#6E3200' },
  APPROVED: { label: 'Approved', bg: '#DDF3E4', fg: '#14502B' },
  REJECTED: { label: 'Rejected', bg: '#FCE8E6', fg: '#5C1410' },
  CANCELLED: { label: 'Cancelled', bg: '#E6E8EB', fg: '#2F343A' },
};

export default function StatusPill({ status, testID }) {
  const style = STYLES[status];
  if (!style) return null;
  return (
    <View style={[styles.pill, { backgroundColor: style.bg }]} testID={testID}>
      <Text style={[styles.text, { color: style.fg }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600' },
});
