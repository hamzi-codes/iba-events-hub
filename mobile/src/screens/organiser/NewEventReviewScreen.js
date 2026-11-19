import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { getOrganisation } from '../../api/browse';
import { createEvent } from '../../api/events';
import ConflictBanner from '../../components/ConflictBanner';
import ErrorBanner from '../../components/ErrorBanner';
import InfoRow from '../../components/InfoRow';
import ScreenHeader from '../../components/ScreenHeader';
import { useEventForm } from '../../context/EventFormContext';
import useLoad from '../../hooks/useLoad';
import { formatDay, formatTime, toUtcIso } from '../../utils/dates';
import { FIELD_LABELS, ONLINE, buildPayload, mapServerFields } from '../../utils/eventForm';

// Screen 12: Review and submit (SUB-06, APR-01). POST /events.
// Shows every value, who it goes to, and "Hidden from students until approved".
// Server errors stay on this screen, and nothing the organiser typed is lost (NFR-REL-03).
// "Save as draft" is Sprint 2.
export default function NewEventReviewScreen({ navigation }) {
  const theme = useTheme();
  const { form, startNew } = useEventForm();
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState(null);

  const organisation = useLoad(() => getOrganisation(form.organisationId), [form.organisationId]);
  const approvers = (organisation.data?.approvers || []).map((a) => a.fullName);
  const goesTo = approvers.length ? approvers.join(', ') : 'the approving authority';

  const startIso = toUtcIso(form.date, form.startTime);
  const endIso = toUtcIso(form.date, form.endTime);
  const speaker = form.speakerName ? [form.speakerName, form.speakerDesignation].filter(Boolean).join(', ') : '';

  const submit = async () => {
    setSubmitting(true);
    setProblem(null);
    try {
      const created = await createEvent(buildPayload(form));
      startNew();
      navigation.popToTop();
      navigation.navigate('SubmissionDetail', { eventId: created.id, notice: 'submitted' });
    } catch (error) {
      setProblem(error);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldProblems = problem?.code === 'VALIDATION_ERROR' ? Object.entries(mapServerFields(problem.fields)) : [];

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Review" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {problem?.code === 'VENUE_CONFLICT' ? <ConflictBanner message={problem.message} testID="review-conflict" /> : null}
        {problem && problem.code !== 'VENUE_CONFLICT' ? <ErrorBanner message={problem.message} testID="review-error" /> : null}
        {fieldProblems.length > 0 ? (
          <View style={styles.fieldProblems} testID="review-field-errors">
            {fieldProblems.map(([key, message]) => (
              <Text key={key}>
                {FIELD_LABELS[key] || key}: {message}
              </Text>
            ))}
            <Text style={styles.fix}>Go back and fix these, then submit again.</Text>
          </View>
        ) : null}

        <Text variant="titleLarge" style={styles.title} testID="review-title">
          {form.title}
        </Text>
        <View style={[styles.box, { borderColor: theme.colors.outline }]}>
          <InfoRow label="Organiser" value={form.organisationName} />
          <InfoRow label="Type" value={form.eventType} />
          <InfoRow label="When" value={`${formatDay(startIso)} · ${formatTime(startIso)} - ${formatTime(endIso)}`} />
          <InfoRow label="Venue" value={form.venueChoice === ONLINE ? 'Online' : form.venueName} />
          <InfoRow label="Capacity" value={form.capacity} />
          <InfoRow label="Sign Up" value={form.registrationRequired ? 'Required' : 'Not Required'} />
          <InfoRow label="Attendance" value={form.attendanceEnabled ? 'Will be taken' : 'Not taken'} />
          <InfoRow label="Speaker" value={speaker} />
          <InfoRow label="Presenter" value={form.presenterName} />
          <InfoRow label="Thesis" value={form.thesisTitle} />
          <InfoRow label="Supervisor" value={form.supervisorName} />
          <InfoRow label="Description" value={form.description} />
        </View>

        <View style={[styles.box, styles.goesTo, { borderColor: theme.colors.outline }]} testID="goes-to">
          <Text style={styles.center}>Goes to: {organisation.loading ? '...' : goesTo}</Text>
          <Text style={[styles.center, styles.small]}>Hidden from students until approved</Text>
        </View>

        <Button mode="contained" onPress={submit} loading={submitting} disabled={submitting} style={styles.submit} contentStyle={styles.buttonContent} testID="submit-event">
          Submit for Approval
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()} disabled={submitting} testID="review-back">
          Back
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontWeight: '700', marginBottom: 10 },
  box: { borderWidth: 1, borderRadius: 4, padding: 12, marginBottom: 14 },
  goesTo: { alignItems: 'center' },
  center: { textAlign: 'center' },
  small: { fontSize: 12, marginTop: 2 },
  submit: { marginTop: 6 },
  buttonContent: { height: 48 },
  fieldProblems: { backgroundColor: '#FCE8E6', borderColor: '#B3261E', borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 12 },
  fix: { marginTop: 6, fontStyle: 'italic' },
});
