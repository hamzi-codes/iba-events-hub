import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { cancelEvent, getEvent } from '../../api/events';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorBanner from '../../components/ErrorBanner';
import HistoryTimeline from '../../components/HistoryTimeline';
import InfoRow from '../../components/InfoRow';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import StatusPill from '../../components/StatusPill';
import { useAuth } from '../../context/AuthContext';
import useLoad from '../../hooks/useLoad';
import { formatDay, formatTime } from '../../utils/dates';

// Screen 13: Submission detail (SUB-07, 08, 10, APR-08). GET /events/:id.
// Status, the details, the history timeline (who, role, when, comment), then
//   Edit and Resubmit  (only when Changes Requested)
//   Cancel Event       (Pending, Changes Requested or Approved) -> screen 15, the cancel sheet
// No Duplicate in Sprint 1.
const NOTICES = {
  submitted: 'Submitted for approval. The event stays hidden from students until it is approved.',
  resubmitted: 'Changes saved and sent for approval again.',
};

export default function SubmissionDetailScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { eventId, notice } = route.params;
  const { data: event, error, loading, refreshing, reload, refresh } = useLoad(() => getEvent(eventId), [eventId]);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const canEdit = event?.status === 'CHANGES_REQUESTED';
  const canCancel = event && ['PENDING', 'CHANGES_REQUESTED', 'APPROVED'].includes(event.status);
  const approved = event?.status === 'APPROVED';
  const speaker = event?.speakerName ? [event.speakerName, event.speakerDesignation].filter(Boolean).join(', ') : '';

  const confirmCancel = async (reason) => {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelEvent(eventId, { reason });
      setCancelOpen(false);
      reload();
    } catch (e) {
      setCancelError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Event" onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingView message="Loading event" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="detail-error" />
          {notice && NOTICES[notice] && event ? <ErrorBanner tone="info" message={NOTICES[notice]} testID="detail-notice" /> : null}
          {event ? (
            <>
              <StatusPill status={event.status} testID="detail-status" />
              <Text variant="titleLarge" style={styles.title} testID="detail-title">
                {event.title}
              </Text>
              <InfoRow label="Organiser" value={event.organisationName} />
              <InfoRow label="Type" value={event.eventType} />
              <InfoRow label="When" value={`${formatDay(event.startAt)} · ${formatTime(event.startAt)} - ${formatTime(event.endAt)}`} />
              <InfoRow label="Venue" value={event.isOnline ? 'Online' : event.venue?.name} />
              <InfoRow label="Capacity" value={event.capacity != null ? String(event.capacity) : ''} />
              <InfoRow label="Speaker" value={speaker} />
              <InfoRow label="Presenter" value={event.presenterName} />
              <InfoRow label="Thesis" value={event.thesisTitle} />
              <InfoRow label="Supervisor" value={event.supervisorName} />

              <Text style={styles.heading}>History</Text>
              <HistoryTimeline history={event.history || []} currentUserId={user?.id} />

              {canEdit ? (
                <Button mode="outlined" onPress={() => navigation.navigate('EditEvent', { eventId })} style={styles.button} contentStyle={styles.buttonContent} testID="edit-resubmit">
                  Edit and Resubmit
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  mode="outlined"
                  textColor={theme.colors.error}
                  onPress={() => {
                    setCancelError(null);
                    setCancelOpen(true);
                  }}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  testID="cancel-event"
                >
                  Cancel Event
                </Button>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}
      <ConfirmDialog
        visible={cancelOpen}
        title="Cancel this event?"
        message={approved ? 'Students will see that this event was cancelled.' : 'The venue slot will be free again.'}
        reasonLabel={approved ? 'Reason? (Required)' : 'Reason (optional)'}
        reasonPlaceholder="e.g. Speaker unavailable"
        minLength={approved ? 10 : 0}
        confirmLabel="Cancel Event"
        cancelLabel="Keep event"
        busy={cancelling}
        error={cancelError}
        onConfirm={confirmCancel}
        onDismiss={() => setCancelOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontWeight: '700', marginVertical: 10 },
  heading: { fontWeight: '700', marginTop: 18, marginBottom: 10, fontSize: 16 },
  button: { marginTop: 10 },
  buttonContent: { height: 46 },
});
