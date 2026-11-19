import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { formatDateTime } from '../utils/dates';

// Who did what and when (FR-APR-08). Newest first, like the wireframe:
//   Changes requested
//   Office of Student Societies, Approver, 3 Nov 2026, 9:00 AM
//   "Please pick a larger venue"
// Entries come from the server; this screen never edits them (NFR-SEC-08).
const ROLE_LABELS = { student: 'Student', organiser: 'Organiser', approver: 'Approver', admin: 'Admin' };

export function historyTitle(entry) {
  if (entry.toStatus === 'PENDING') return entry.fromStatus ? 'Resubmitted' : 'Submitted';
  const titles = {
    CHANGES_REQUESTED: 'Changes requested',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
  };
  return titles[entry.toStatus] || entry.toStatus;
}

export default function HistoryTimeline({ history = [], currentUserId }) {
  const theme = useTheme();
  const entries = [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (entries.length === 0) return <Text>No history yet.</Text>;

  return (
    <View testID="history-timeline">
      {entries.map((entry, index) => {
        const who = entry.actor?.id && entry.actor.id === currentUserId ? 'You' : entry.actor?.fullName || 'Someone';
        const role = ROLE_LABELS[entry.actorRole] || entry.actorRole;
        const last = index === entries.length - 1;
        return (
          <View key={`${entry.createdAt}-${index}`} style={styles.row} testID="history-entry">
            <View style={styles.rail}>
              <View style={[styles.dot, { borderColor: theme.colors.onSurface, backgroundColor: theme.colors.background }]} />
              {!last ? <View style={[styles.line, { backgroundColor: theme.colors.onSurface }]} /> : null}
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{historyTitle(entry)}</Text>
              <Text style={styles.meta}>
                {who} · {role} · {formatDateTime(entry.createdAt)}
              </Text>
              {entry.comment ? <Text style={styles.comment}>"{entry.comment}"</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, marginTop: 2 },
  line: { width: 2, flex: 1, marginVertical: 2 },
  body: { flex: 1, paddingLeft: 10, paddingBottom: 18 },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  comment: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
});
