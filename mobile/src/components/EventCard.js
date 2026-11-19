import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { formatDateTime } from '../utils/dates';
import StatusPill from './StatusPill';

// One event row as drawn on the Organisation page: date and time with venue on the left,
// the event name next to it, and a label on the right. The label shows the status for
// anything that is not Approved, so a cancelled event is clearly marked (FR-BRW-06).
// The "Slots left / Full" tags are Sprint 2.
export default function EventCard({ event, onPress, right, testID }) {
  const theme = useTheme();
  const place = event.isOnline ? 'Online' : event.venue?.name || '';
  const tag = right !== undefined ? right : event.status !== 'APPROVED' ? <StatusPill status={event.status} /> : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatDateTime(event.startAt)}, ${place}`}
      style={({ pressed }) => [
        styles.card,
        { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
      ]}
      testID={testID}
    >
      <View style={styles.left}>
        <Text style={styles.small}>{formatDateTime(event.startAt)}</Text>
        <Text style={[styles.small, { color: theme.colors.onSurfaceVariant }]}>{place}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.title}>{event.title}</Text>
      </View>
      {tag ? <View style={styles.right}>{tag}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  left: { flex: 1.1 },
  middle: { flex: 1.3, paddingHorizontal: 8 },
  right: { marginLeft: 4, maxWidth: 90 },
  small: { fontSize: 12 },
  title: { fontSize: 15, fontWeight: '700' },
});
