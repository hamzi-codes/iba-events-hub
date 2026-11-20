import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

import { getEventTypes, getVenues } from '../../api/browse';
import { getEvent, resubmitEvent, updateEvent } from '../../api/events';
import BasicsFields from '../../components/event/BasicsFields';
import DetailsFields from '../../components/event/DetailsFields';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import { useEventForm } from '../../context/EventFormContext';
import useConflictCheck from '../../hooks/useConflictCheck';
import useFieldErrors from '../../hooks/useFieldErrors';
import useLoad from '../../hooks/useLoad';
import { buildPayload, mapServerFields, validateBasics, validateDetails } from '../../utils/eventForm';

// Screen 14: Edit (Changes Requested) (SUB-08, APR-07).
// The same form, pre-filled. PUT /events/:id, then POST /events/:id/resubmit.
// The conflict check ignores the event itself (excludeEventId). The organisation is locked.
export default function EditEventScreen({ navigation, route }) {
  const theme = useTheme();
  const { eventId } = route.params;
  const { form, patch, startEdit, editingId } = useEventForm();
  const { errors, setErrors, clearFor } = useFieldErrors();
  const [types, setTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState(null);

  const loaded = useLoad(() => getEvent(eventId), [eventId]);
  const venues = useLoad(() => getVenues(), []);
  const conflict = useConflictCheck({ ...form, excludeEventId: eventId });

  // Fill the form once, when the event has loaded.
  useEffect(() => {
    if (loaded.data && editingId !== eventId) startEdit(loaded.data);
  }, [loaded.data, editingId, eventId, startEdit]);

  useEffect(() => {
    if (!form.category) return;
    getEventTypes(form.category).then(setTypes).catch(() => {});
  }, [form.category]);

  const change = (changes) => {
    patch(changes);
    clearFor(changes);
  };

  const ready = editingId === eventId && !!venues.data;
  const blocked = conflict.status === 'conflict' || conflict.status === 'checking';
  const organisations = [{ id: form.organisationId, name: form.organisationName, category: form.category }];

  const save = async () => {
    const found = { ...validateBasics(form, types), ...validateDetails(form) };
    setErrors(found);
    setProblem(null);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await updateEvent(eventId, buildPayload(form));
      await resubmitEvent(eventId);
      navigation.popToTop();
      navigation.navigate('SubmissionDetail', { eventId, notice: 'resubmitted' });
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR' && error.fields) setErrors(mapServerFields(error.fields));
      setProblem(error);
    } finally {
      setSaving(false);
    }
  };

  const shownConflict = problem?.code === 'VENUE_CONFLICT' ? problem.message : null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={`Edit: ${loaded.data?.title || 'Event'}`} onBack={() => navigation.goBack()} />
      {loaded.loading || venues.loading ? (
        <LoadingView message="Loading event" />
      ) : loaded.error ? (
        <View style={styles.content}>
          <ErrorBanner message={loaded.error.message} onRetry={loaded.reload} testID="edit-load-error" />
        </View>
      ) : !ready ? (
        <View style={styles.content}>
          <ErrorBanner message={venues.error?.message} onRetry={venues.reload} testID="edit-venues-error" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {problem && problem.code !== 'VENUE_CONFLICT' ? <ErrorBanner message={problem.message} testID="edit-error" /> : null}
          <BasicsFields form={form} change={change} errors={errors} organisations={organisations} eventTypes={types} lockOrganisation />
          <DetailsFields form={form} change={change} errors={errors} venues={venues.data} conflict={conflict} serverConflictMessage={shownConflict} />
          <Button mode="contained" onPress={save} loading={saving} disabled={saving || blocked} style={styles.save} contentStyle={styles.saveContent} testID="save-resubmit">
            Save and Resubmit
          </Button>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  save: { marginTop: 16 },
  saveContent: { height: 48 },
});
