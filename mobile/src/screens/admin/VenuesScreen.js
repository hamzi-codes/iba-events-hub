import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { createVenue, getVenues, setVenueStatus, updateVenue } from '../../api/admin';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import FormField from '../../components/FormField';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import useFieldErrors from '../../hooks/useFieldErrors';
import useLoad from '../../hooks/useLoad';

// Screen 25: Venues (ADM-05). GET, POST, PUT, PATCH /admin/venues.
// The list on top, the add form below. Tap a venue to edit it in the same form.
// The venue list powers the conflict checks. An inactive venue is not offered in the event
// form, but stays on existing events.
export default function VenuesScreen({ navigation }) {
  const theme = useTheme();
  const { data, error, loading, refreshing, reload, refresh } = useLoad(() => getVenues(), []);
  const { errors, setErrors, clearFor } = useFieldErrors();

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState(null);
  const [notice, setNotice] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const editing = editingId ? (data || []).find((v) => v.id === editingId) : null;

  const reset = () => {
    setEditingId(null);
    setName('');
    setLocation('');
    setCapacity('');
    setErrors({});
    setProblem(null);
  };
  const startEdit = (venue) => {
    setEditingId(venue.id);
    setName(venue.name);
    setLocation(venue.location);
    setCapacity(String(venue.capacity));
    setErrors({});
    setProblem(null);
    setNotice(null);
  };
  const clear = (field) => {
    clearFor({ [field]: 1 });
    setProblem(null);
  };

  const save = async () => {
    const found = {};
    if (name.trim().length < 2) found.name = 'Enter the venue name.';
    if (!location.trim()) found.location = 'Enter the building or floor.';
    if (!/^\d+$/.test(capacity.trim()) || Number(capacity) < 1) found.capacity = 'Capacity must be a whole number of at least 1.';
    setErrors(found);
    setProblem(null);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), location: location.trim(), capacity: Number(capacity) };
      if (editingId) await updateVenue(editingId, payload);
      else await createVenue(payload);
      setNotice(`${payload.name} was ${editingId ? 'saved' : 'added'}.`);
      reset();
      reload();
    } catch (e) {
      if (e.fields) setErrors(e.fields);
      setProblem(e); // what was typed stays
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    setStatusBusy(true);
    setStatusError(null);
    try {
      await setVenueStatus(editing.id, !editing.isActive);
      setNotice(`${editing.name} was ${editing.isActive ? 'deactivated' : 'reactivated'}.`);
      setStatusOpen(false);
      reset();
      reload();
    } catch (e) {
      setStatusError(e.message);
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Venues" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {notice ? <ErrorBanner tone="info" message={notice} testID="venues-notice" /> : null}
        <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="venues-error" />
        {loading ? <LoadingView message="Loading venues" /> : null}
        {!loading && data && data.length === 0 ? <EmptyState icon="map-marker-outline" message="No venues yet. Add the first one below." testID="venues-empty" /> : null}
        {!loading &&
          (data || []).map((v) => (
            <Pressable
              key={v.id}
              onPress={() => startEdit(v)}
              accessibilityRole="button"
              accessibilityLabel={`${v.name}, ${v.location}, capacity ${v.capacity}, ${v.isActive ? 'active' : 'inactive'}. Tap to edit`}
              style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.outlineVariant, opacity: pressed ? 0.6 : 1 }]}
              testID={`venue-${v.id}`}
            >
              <View style={styles.text}>
                <Text style={styles.name}>{v.name}</Text>
                <Text style={styles.small}>
                  {v.location} · cap {v.capacity}
                </Text>
              </View>
              <View style={[styles.pill, { borderColor: theme.colors.onSurface }, !v.isActive && styles.pillInactive]}>
                <Text style={styles.pillText}>{v.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </Pressable>
          ))}

        <Text style={styles.heading} testID="venue-form-title">
          {editingId ? 'Edit venue' : 'Add venue'}
        </Text>
        <ErrorBanner message={problem && !problem.fields ? problem.message : undefined} testID="venue-save-error" />
        <FormField label="Name" placeholder="Venue Name" value={name} onChangeText={(v) => { setName(v); clear('name'); }} error={errors.name} maxLength={60} testID="venue-name" />
        <FormField label="Location" placeholder="Building/Floor" value={location} onChangeText={(v) => { setLocation(v); clear('location'); }} error={errors.location} maxLength={80} testID="venue-location" />
        <FormField label="Capacity" placeholder="No of seats" value={capacity} onChangeText={(v) => { setCapacity(v.replace(/[^0-9]/g, '')); clear('capacity'); }} keyboardType="number-pad" error={errors.capacity} testID="venue-capacity" />
        <Button mode="outlined" onPress={save} loading={saving} disabled={saving} contentStyle={styles.buttonContent} style={styles.button} testID="venue-save">
          Save venue
        </Button>
        {editing ? (
          <>
            <Button mode="text" onPress={() => { setStatusError(null); setStatusOpen(true); }} textColor={editing.isActive ? theme.colors.error : undefined} testID="venue-status">
              {editing.isActive ? 'Deactivate venue' : 'Reactivate venue'}
            </Button>
            <Button mode="text" onPress={reset} testID="venue-cancel-edit">
              Cancel editing
            </Button>
          </>
        ) : null}
      </ScrollView>
      <ConfirmDialog
        visible={statusOpen}
        title={editing?.isActive ? 'Deactivate this venue?' : 'Reactivate this venue?'}
        message={editing?.isActive ? 'Organisers will not be offered it for new events. Existing events keep it.' : 'Organisers can choose it again.'}
        confirmLabel={editing?.isActive ? 'Deactivate' : 'Reactivate'}
        cancelLabel="Keep as is"
        busy={statusBusy}
        error={statusError}
        onConfirm={toggleStatus}
        onDismiss={() => setStatusOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  small: { fontSize: 12, marginTop: 2 },
  pill: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 2 },
  pillInactive: { borderStyle: 'dashed' },
  pillText: { fontSize: 12 },
  heading: { fontWeight: '700', fontSize: 16, marginTop: 22, marginBottom: 8 },
  button: { marginTop: 6 },
  buttonContent: { height: 46 },
});
