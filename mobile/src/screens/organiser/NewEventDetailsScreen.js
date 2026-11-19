import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { getVenues } from '../../api/browse';
import DetailsFields from '../../components/event/DetailsFields';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import { useEventForm } from '../../context/EventFormContext';
import useConflictCheck from '../../hooks/useConflictCheck';
import useFieldErrors from '../../hooks/useFieldErrors';
import useLoad from '../../hooks/useLoad';
import { validateDetails } from '../../utils/eventForm';

// Screen 11: New event, details (step 2 of 2). SUB-02, 04, 05, CNF-01, 02, ATT-01.
// GET /venues and GET /events/conflict-check (live, about 400 ms after the last change).
// The conflict message sits under the Venue field and names the clashing event.
// Next is disabled while there is a conflict, or while the check is running.
// "Save as draft" and the alternatives list are Sprint 2.
export default function NewEventDetailsScreen({ navigation }) {
  const theme = useTheme();
  const { form, patch } = useEventForm();
  const { errors, setErrors, clearFor } = useFieldErrors();
  const venues = useLoad(() => getVenues(), []);
  const conflict = useConflictCheck(form);

  const change = (changes) => {
    patch(changes);
    clearFor(changes);
  };

  const blocked = conflict.status === 'conflict' || conflict.status === 'checking';

  const next = () => {
    const found = validateDetails(form);
    setErrors(found);
    if (Object.keys(found).length === 0) navigation.navigate('NewEventReview');
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="New event" onBack={() => navigation.goBack()} right="Step 2 of 2" />
      {venues.loading ? (
        <LoadingView message="Loading venues" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={venues.error?.message} onRetry={venues.error ? venues.reload : undefined} testID="venues-error" />
          {conflict.status === 'error' ? (
            <ErrorBanner tone="info" message="We could not check the venue just now. You can continue, and we will check again when you submit." testID="check-failed" />
          ) : null}
          <DetailsFields form={form} change={change} errors={errors} venues={venues.data || []} conflict={conflict} />
          {conflict.status === 'checking' ? <Text style={styles.checking} testID="checking">Checking the venue...</Text> : null}
          <Button mode="outlined" onPress={next} disabled={blocked || !venues.data} style={styles.next} contentStyle={styles.nextContent} testID="details-next">
            Next
          </Button>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  checking: { fontSize: 12, marginTop: 4 },
  next: { marginTop: 16, borderColor: '#111', borderWidth: 2 },
  nextContent: { height: 48 },
});
