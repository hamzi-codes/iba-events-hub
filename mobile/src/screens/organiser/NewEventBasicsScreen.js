import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

import { getEventTypes } from '../../api/browse';
import BasicsFields from '../../components/event/BasicsFields';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useEventForm } from '../../context/EventFormContext';
import useFieldErrors from '../../hooks/useFieldErrors';
import useLoad from '../../hooks/useLoad';
import { validateBasics } from '../../utils/eventForm';
import { resolveOrganiserOrganisations } from '../../utils/organisations';

// Screen 10: New event, basics (step 1 of 2). SUB-01, SUB-03. GET /settings/event-types.
// The organisation picker only shows when the organiser is linked to several organisations.
// "Save as draft" is Sprint 2, so it is not shown.
export default function NewEventBasicsScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { form, patch } = useEventForm();
  const { errors, setErrors, clearFor } = useFieldErrors();
  const [types, setTypes] = useState([]);
  const [typesError, setTypesError] = useState(null);

  const orgs = useLoad(() => resolveOrganiserOrganisations(user), [user?.id]);
  const organisations = orgs.data || [];

  // One organisation: choose it for them.
  useEffect(() => {
    if (organisations.length === 1 && form.organisationId !== organisations[0].id) {
      const [only] = organisations;
      patch({ organisationId: only.id, organisationName: only.name, category: only.category, eventType: '' });
    }
  }, [organisations, form.organisationId, patch]);

  // Event types depend on the category of the chosen organisation.
  useEffect(() => {
    let cancelled = false;
    setTypesError(null);
    if (!form.category) {
      setTypes([]);
      return undefined;
    }
    getEventTypes(form.category)
      .then((list) => {
        if (!cancelled) setTypes(list);
      })
      .catch((error) => {
        if (!cancelled) setTypesError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [form.category]);

  const change = (changes) => {
    patch(changes);
    clearFor(changes);
  };

  const next = () => {
    const found = validateBasics(form, types);
    setErrors(found);
    if (Object.keys(found).length === 0) navigation.navigate('NewEventDetails');
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="New event" onBack={() => navigation.goBack()} right="Step 1 of 2" />
      {orgs.loading ? (
        <LoadingView message="Loading" />
      ) : orgs.error ? (
        <View style={styles.content}>
          <ErrorBanner message={orgs.error.message} onRetry={orgs.reload} testID="basics-error" />
        </View>
      ) : organisations.length === 0 ? (
        <EmptyState icon="account-off-outline" message="You are not linked to an organisation yet. Ask an admin to add you as an organiser." testID="no-organisation" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={typesError?.message} testID="types-error" />
          <BasicsFields form={form} change={change} errors={errors} organisations={organisations} eventTypes={types} />
          <Button mode="outlined" onPress={next} style={styles.next} contentStyle={styles.nextContent} testID="basics-next">
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
  next: { marginTop: 16, borderColor: '#111', borderWidth: 2 },
  nextContent: { height: 48 },
});
