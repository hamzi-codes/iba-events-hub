import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

import { createOrganisation, getOrganisations, setOrganisationStatus, updateOrganisation } from '../../api/admin';
import ConfirmDialog from '../../components/ConfirmDialog';
import DropdownField from '../../components/DropdownField';
import ErrorBanner from '../../components/ErrorBanner';
import FormField from '../../components/FormField';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import UserPicker from '../../components/UserPicker';
import useFieldErrors from '../../hooks/useFieldErrors';
import useLoad from '../../hooks/useLoad';

// Screen 24: New organisation / Edit (ADM-03, 04).
// POST /admin/organisations, PUT /admin/organisations/:id, PATCH .../status.
// Needs at least one approving authority (type an email and pick from the matches).
// Deactivate is blocked while events are pending (409 HAS_PENDING_EVENTS).
const CATEGORY_OPTIONS = [
  { value: 'society', label: 'Society' },
  { value: 'school', label: 'School' },
  { value: 'department', label: 'Department' },
];

export default function OrganisationFormScreen({ navigation, route }) {
  const theme = useTheme();
  const { organisationId } = route.params || {};
  const editing = !!organisationId;
  const { errors, setErrors, clearFor } = useFieldErrors();

  const [category, setCategory] = useState(route.params?.category || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [organisers, setOrganisers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // The API has no "get one organisation" request, so the list is loaded and the one is picked out.
  const loaded = useLoad(
    () => (editing ? getOrganisations({ includeInactive: true }).then((list) => list.find((o) => o.id === organisationId) || null) : Promise.resolve(null)),
    [organisationId]
  );
  const org = loaded.data;

  useEffect(() => {
    if (!org) return;
    setCategory(org.category);
    setName(org.name);
    setDescription(org.description || '');
    setApprovers(org.approvers || []);
    setOrganisers(org.organisers || []);
  }, [org]);

  const clear = (field) => {
    clearFor({ [field]: 1 });
    setProblem(null);
  };

  const save = async () => {
    const found = {};
    if (!category) found.category = 'Choose Society, School or Department.';
    if (name.trim().length < 2) found.name = 'Enter the organisation name.';
    if (approvers.length < 1) found.approverUserIds = 'Add at least one approving authority.';
    setErrors(found);
    setProblem(null);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        approverUserIds: approvers.map((u) => u.id),
        organiserUserIds: organisers.map((u) => u.id),
      };
      if (editing) await updateOrganisation(organisationId, payload);
      else await createOrganisation({ category, ...payload });
      navigation.popTo('Organisations', { notice: editing ? `${payload.name} was saved.` : `${payload.name} was added.` });
    } catch (e) {
      if (e.fields) setErrors(e.fields);
      setProblem(e); // everything typed stays on screen
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async () => {
    setStatusBusy(true);
    setStatusError(null);
    try {
      await setOrganisationStatus(organisationId, !org.isActive);
      setStatusOpen(false);
      navigation.popTo('Organisations', { notice: `${org.name} was ${org.isActive ? 'deactivated' : 'reactivated'}.` });
    } catch (e) {
      setStatusError(e.message);
    } finally {
      setStatusBusy(false);
    }
  };

  const pending = org?.pendingEventsCount || 0;
  const ready = !editing || !!org;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={editing ? 'Edit organisation' : 'New organisation'} onBack={() => navigation.goBack()} />
      {loaded.loading ? (
        <LoadingView message="Loading" />
      ) : loaded.error ? (
        <View style={styles.content}>
          <ErrorBanner message={loaded.error.message} onRetry={loaded.reload} testID="org-load-error" />
        </View>
      ) : !ready ? (
        <View style={styles.content}>
          <ErrorBanner message="We could not find that organisation. Go back and try again." testID="org-missing" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={problem && !problem.fields ? problem.message : undefined} testID="org-save-error" />
          {org && !org.isActive ? <ErrorBanner tone="info" message="This organisation is inactive. Students do not see it, but its past events stay visible." testID="org-inactive" /> : null}
          <DropdownField label="Category" placeholder="Society / School / Department" value={category} options={CATEGORY_OPTIONS} onChange={(v) => { setCategory(v); clear('category'); }} disabled={editing} error={errors.category} testID="org-category" />
          <FormField label="Name" placeholder="Organisation Name" value={name} onChangeText={(v) => { setName(v); clear('name'); }} error={errors.name} maxLength={80} testID="org-name" />
          <FormField label="Description" placeholder="Short description" value={description} onChangeText={(v) => { setDescription(v); clear('description'); }} error={errors.description} multiline numberOfLines={3} style={{ minHeight: 80 }} testID="org-description" />
          <UserPicker label="Approving authority (required)" selected={approvers} onChange={(v) => { setApprovers(v); clear('approverUserIds'); }} error={errors.approverUserIds} hint="Type a name or email, then pick the account. You can add more than one." testID="org-approvers" />
          <UserPicker label="Organiser accounts (optional)" selected={organisers} onChange={(v) => { setOrganisers(v); clear('organiserUserIds'); }} error={errors.organiserUserIds} testID="org-organisers" />

          <Button mode="outlined" onPress={save} loading={saving} disabled={saving} style={styles.save} contentStyle={styles.saveContent} testID="org-save">
            Save organisation
          </Button>
          {editing ? (
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              disabled={org.isActive && pending > 0}
              onPress={() => { setStatusError(null); setStatusOpen(true); }}
              style={[styles.deactivate, org.isActive && pending > 0 ? styles.dashed : null]}
              contentStyle={styles.saveContent}
              testID="org-status"
            >
              {org.isActive ? (pending > 0 ? `Deactivate (${pending} pending ${pending === 1 ? 'event' : 'events'})` : 'Deactivate') : 'Reactivate'}
            </Button>
          ) : null}
        </ScrollView>
      )}
      <ConfirmDialog
        visible={statusOpen}
        title={org?.isActive ? 'Deactivate this organisation?' : 'Reactivate this organisation?'}
        message={org?.isActive ? 'Students will no longer see it in the lists. Its past events stay visible.' : 'It will appear in the lists again.'}
        confirmLabel={org?.isActive ? 'Deactivate' : 'Reactivate'}
        cancelLabel="Keep as is"
        busy={statusBusy}
        error={statusError}
        onConfirm={changeStatus}
        onDismiss={() => setStatusOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  save: { marginTop: 12 },
  saveContent: { height: 46 },
  deactivate: { marginTop: 12 },
  dashed: { borderStyle: 'dashed' },
});
