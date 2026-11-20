import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { getEvent } from '../../api/events';
import ErrorBanner from '../../components/ErrorBanner';
import HistoryTimeline from '../../components/HistoryTimeline';
import InfoRow from '../../components/InfoRow';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import StatusPill from '../../components/StatusPill';
import { useAuth } from '../../context/AuthContext';
import useLoad from '../../hooks/useLoad';
import { formatDay, formatTime } from '../../utils/dates';

// Screen 26, event view: every detail and the full history. Read-only, no buttons (ADM-07).
export default function AdminEventDetailScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { eventId } = route.params;
  const { data: event, error, loading, refreshing, reload, refresh } = useLoad(() => getEvent(eventId), [eventId]);
  const speaker = event?.speakerName ? [event.speakerName, event.speakerDesignation].filter(Boolean).join(', ') : '';

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Event" onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingView message="Loading event" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="admin-event-error" />
          {event ? (
            <>
              <StatusPill status={event.status} testID="admin-event-status" />
              <Text variant="titleLarge" style={styles.title} testID="admin-event-title">
                {event.title}
              </Text>
              <InfoRow label="Organiser" value={event.organisationName} />
              <InfoRow label="Submitted by" value={event.createdBy?.fullName} />
              <InfoRow label="Type" value={event.eventType} />
              <InfoRow label="When" value={`${formatDay(event.startAt)} · ${formatTime(event.startAt)} - ${formatTime(event.endAt)}`} />
              <InfoRow label="Venue" value={event.isOnline ? 'Online' : event.venue?.name} />
              <InfoRow label="Capacity" value={event.capacity != null ? String(event.capacity) : ''} />
              <InfoRow label="Sign Up" value={event.registrationRequired ? 'Required' : 'Not Required'} />
              <InfoRow label="Speaker" value={speaker} />
              <InfoRow label="Presenter" value={event.presenterName} />
              <InfoRow label="Thesis" value={event.thesisTitle} />
              <InfoRow label="Supervisor" value={event.supervisorName} />
              <InfoRow label="Description" value={event.description} />
              <Text style={styles.heading}>History</Text>
              <HistoryTimeline history={event.history || []} currentUserId={user?.id} />
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
  title: { fontWeight: '700', marginVertical: 10 },
  heading: { fontWeight: '700', marginTop: 18, marginBottom: 10, fontSize: 16 },
});
