import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getEvent } from '../../api/events';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import StatusPill from '../../components/StatusPill';
import useLoad from '../../hooks/useLoad';
import { formatDay, formatTime } from '../../utils/dates';

// Screen 8: Event details (BRW-05, 06). GET /events/:id.
// Title, organiser, type, date, start and end, venue, capacity, speaker (only if present),
// description, and a Cancelled label. The heart, Register, Add to Calendar and Remind me
// are Sprint 2. Sprint 1 shows Capacity, not seats left (decision D12).
function InfoRow({ label, value, testID }) {
  const theme = useTheme();
  return (
    <View style={styles.row} testID={testID}>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function EventDetailsScreen({ navigation, route }) {
  const theme = useTheme();
  const { eventId } = route.params;
  const { data: event, error, loading, refreshing, reload, refresh } = useLoad(() => getEvent(eventId), [eventId]);

  const speaker = event && event.speakerName ? [event.speakerName, event.speakerDesignation].filter(Boolean).join(', ') : null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Event" onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingView message="Loading event" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="event-error" />
          {event ? (
            <>
              <View style={styles.image} accessibilityLabel="Event image placeholder">
                <MaterialCommunityIcons name="image-outline" size={36} color="#7C828B" />
              </View>
              {event.status !== 'APPROVED' ? (
                <View style={styles.pill}>
                  <StatusPill status={event.status} testID="event-status" />
                </View>
              ) : null}
              <Text variant="titleLarge" style={styles.title} testID="event-title">
                {event.title}
              </Text>
              <InfoRow label="Organiser" value={event.organisationName} />
              <InfoRow label="Type" value={event.eventType} />
              <InfoRow label="Date" value={`${formatDay(event.startAt)} · ${formatTime(event.startAt)} - ${formatTime(event.endAt)}`} />
              <InfoRow label="Venue" value={event.isOnline ? 'Online' : event.venue?.name || ''} />
              <InfoRow label="Capacity" value={event.capacity != null ? String(event.capacity) : ''} />
              {speaker ? <InfoRow label="Speaker" value={speaker} testID="event-speaker" /> : null}
              {event.presenterName ? <InfoRow label="Presenter" value={event.presenterName} /> : null}
              {event.thesisTitle ? <InfoRow label="Thesis" value={event.thesisTitle} /> : null}
              {event.supervisorName ? <InfoRow label="Supervisor" value={event.supervisorName} /> : null}
              {event.description ? (
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text>{event.description}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  image: { height: 110, backgroundColor: '#DADCE0', alignItems: 'center', justifyContent: 'center', borderRadius: 4, marginBottom: 14 },
  pill: { marginBottom: 8 },
  title: { fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', paddingVertical: 5 },
  label: { width: 96 },
  value: { flex: 1 },
  descriptionBox: { marginTop: 16 },
  descriptionLabel: { fontWeight: '700', marginBottom: 4 },
});
