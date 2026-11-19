import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { approve, reject, requestChanges } from '../../api/approvals';
import { getEvent } from '../../api/events';
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

// Screen 17: Review submission (APR-03, 08) and screen 18: the three decision sheets
// (APR-04 to 06, 09). GET /events/:id, then POST /approvals/:id/approve, /request-changes
// or /reject. Approve needs no comment, the other two need at least 10 characters.
// The Approve button is just "Approve" (no conflict state, Section 16.2).
const SHEETS = {
  approve: {
    title: 'Approve this event?',
    message: 'It will be published to students.',
    label: 'Comments (optional)',
    min: 0,
    confirm: 'Approve and Publish',
    call: approve,
    done: (title) => `"${title}" was approved and is now visible to students.`,
  },
  changes: {
    title: 'Request changes',
    message: 'The organiser can edit the event and send it again.',
    label: 'Comments (required)',
    min: 10,
    confirm: 'Send back to organiser',
    call: requestChanges,
    done: (title) => `"${title}" was sent back to the organiser.`,
  },
  reject: {
    title: 'Reject (final)',
    message: 'This cannot be undone. Nobody can change a rejected event.',
    label: 'Why? (min. 10 characters)',
    min: 10,
    confirm: 'Reject Event',
    call: reject,
    done: (title) => `"${title}" was rejected.`,
  },
};
// These two mean the decision was not made, and the reviewer needs to read why.
const BLOCKING_CODES = ['ALREADY_DECIDED', 'EVENT_ALREADY_STARTED'];

export default function ReviewSubmissionScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { eventId } = route.params;
  const { data: event, error, loading, refreshing, reload, refresh } = useLoad(() => getEvent(eventId), [eventId]);

  const [showHistory, setShowHistory] = useState(false);
  const [sheet, setSheet] = useState(null); // 'approve' | 'changes' | 'reject' | null
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState(null);
  const [blocked, setBlocked] = useState(null); // message from ALREADY_DECIDED or EVENT_ALREADY_STARTED

  const pending = event?.status === 'PENDING';
  const speaker = event?.speakerName ? [event.speakerName, event.speakerDesignation].filter(Boolean).join(', ') : '';
  const config = sheet ? SHEETS[sheet] : null;

  const open = (name) => {
    setSheetError(null);
    setSheet(name);
  };

  const confirm = async (comment) => {
    setBusy(true);
    setSheetError(null);
    try {
      await config.call(eventId, { comment });
      const message = config.done(event.title);
      setSheet(null);
      navigation.popTo('PendingQueue', { notice: message });
    } catch (e) {
      if (BLOCKING_CODES.includes(e.code)) {
        setSheet(null);
        setBlocked(e.message);
        reload(); // shows the real status; the buttons disappear if it is no longer Pending
      } else {
        setSheetError(e.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={event?.title || 'Event'} onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingView message="Loading event" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="review-load-error" />
          <ErrorBanner message={blocked} testID="review-blocked" />
          {event ? (
            <>
              <StatusPill status={event.status} testID="review-status" />
              <View style={[styles.box, { borderColor: theme.colors.outline }]}>
                <InfoRow label="From" value={`${event.createdBy?.fullName || 'Organiser'}, ${event.organisationName}`} testID="review-from" />
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
              </View>

              <Button mode="text" onPress={() => setShowHistory((v) => !v)} style={styles.historyLink} testID="toggle-history">
                {showHistory ? 'Hide full history' : 'View full history'}
              </Button>
              {showHistory ? <HistoryTimeline history={event.history || []} currentUserId={user?.id} /> : null}

              {pending ? (
                <View style={styles.buttons}>
                  <Button mode="contained" onPress={() => open('approve')} contentStyle={styles.buttonContent} style={styles.button} testID="decide-approve">
                    Approve
                  </Button>
                  <Button mode="outlined" onPress={() => open('changes')} contentStyle={styles.buttonContent} style={styles.button} testID="decide-changes">
                    Request changes
                  </Button>
                  <Button mode="outlined" textColor={theme.colors.error} onPress={() => open('reject')} contentStyle={styles.buttonContent} style={styles.button} testID="decide-reject">
                    Reject
                  </Button>
                </View>
              ) : (
                <Text style={styles.decided} testID="review-not-pending">
                  This event is not waiting for a decision.
                </Text>
              )}
            </>
          ) : null}
        </ScrollView>
      )}
      {config ? (
        <ConfirmDialog
          visible
          title={config.title}
          message={config.message}
          reasonLabel={config.label}
          reasonPlaceholder={config.min ? 'Write your comment here' : 'Optional'}
          minLength={config.min}
          tooShortMessage={`Enter a comment of at least ${config.min} characters. The organiser will see it.`}
          confirmLabel={config.confirm}
          cancelLabel="Back"
          busy={busy}
          error={sheetError}
          onConfirm={confirm}
          onDismiss={() => setSheet(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  box: { borderWidth: 1, borderRadius: 4, padding: 12, marginTop: 10 },
  historyLink: { alignSelf: 'flex-start', marginVertical: 6 },
  buttons: { marginTop: 14 },
  button: { marginBottom: 10 },
  buttonContent: { height: 46 },
  decided: { marginTop: 16, fontStyle: 'italic' },
});
