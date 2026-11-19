import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, useTheme } from 'react-native-paper';

import { getOrganisations, getUser, setUserStatus, updateAccess } from '../../api/admin';
import DropdownField from '../../components/DropdownField';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import SwitchRow from '../../components/SwitchRow';
import { useAuth } from '../../context/AuthContext';
import useLoad from '../../hooks/useLoad';

// Screen 22: User detail (AUT-08, 09, ADM-02).
// GET /admin/users/:id, then PUT /admin/users/:id/access (roles and links together) and
// PATCH /admin/users/:id/status. Name and email are read only. The organiser and approver
// roles follow the linked organisations: add a link to give the role, remove the last link
// of a type to take it away (Section 6.6). Nothing is saved until "Save changes".
const TYPE_OPTIONS = [
  { value: 'organiser', label: 'Organiser' },
  { value: 'approver', label: 'Approver' },
];
const TYPE_NAMES = { organiser: 'Organiser', approver: 'Approver' };

export default function UserDetailScreen({ navigation, route }) {
  const theme = useTheme();
  const { user: me, refreshUser } = useAuth();
  const { userId } = route.params;
  const { data, error, loading, reload } = useLoad(() => getUser(userId), [userId]);
  const orgs = useLoad(() => getOrganisations({ includeInactive: false }), []);

  const [links, setLinks] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [active, setActive] = useState(true);
  const [addOrg, setAddOrg] = useState('');
  const [addType, setAddType] = useState('');
  const [addError, setAddError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setLinks(data.affiliations || []);
    setAdmin(data.roles.includes('admin'));
    setActive(data.isActive);
  }, [data]);

  const isSelf = !!data && me?.id === data.id;
  const hasLink = (type) => links.some((l) => l.type === type);
  const roleNames = ['Student', ...(admin ? ['Admin'] : []), ...(hasLink('organiser') ? ['Organiser'] : []), ...(hasLink('approver') ? ['Approver'] : [])];
  const touched = () => {
    setSaved(false);
    setProblem(null);
  };

  const addLink = () => {
    if (!addOrg || !addType) {
      setAddError('Choose an organisation and a type first.');
      return;
    }
    if (links.some((l) => l.organisationId === addOrg && l.type === addType)) {
      setAddError('This link is already there.');
      return;
    }
    const organisation = (orgs.data || []).find((o) => o.id === addOrg);
    setLinks([...links, { organisationId: addOrg, organisationName: organisation.name, category: organisation.category, type: addType }]);
    setAddOrg('');
    setAddType('');
    setAddError(null);
    touched();
  };

  const save = async () => {
    setSaving(true);
    setProblem(null);
    setSaved(false);
    try {
      const roles = ['student', ...(admin ? ['admin'] : []), ...(hasLink('organiser') ? ['organiser'] : []), ...(hasLink('approver') ? ['approver'] : [])];
      await updateAccess(userId, { roles, affiliations: links.map((l) => ({ organisationId: l.organisationId, type: l.type })) });
      if (active !== data.isActive) await setUserStatus(userId, active);
      setSaved(true);
      await reload();
      if (isSelf) refreshUser();
    } catch (e) {
      setProblem(e); // what was typed stays on screen
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={data?.fullName || 'User'} onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingView message="Loading user" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="user-error" />
          {data ? (
            <>
              <Text variant="titleMedium" style={styles.name}>
                {data.fullName}
              </Text>
              <Text style={styles.email} testID="user-email">
                {data.email}
              </Text>

              <Text style={styles.heading}>Roles</Text>
              <Text testID="user-roles">{roleNames.join(', ')}</Text>
              <HelperText type="info" visible>
                Organiser and Approver come from the linked organisations below.
              </HelperText>
              <SwitchRow label="System administrator" disabled={isSelf} value={admin} onValueChange={(v) => { setAdmin(v); touched(); }} testID="user-admin-switch" />
              {isSelf ? <HelperText type="info" visible>You cannot remove your own administrator access.</HelperText> : null}

              <Text style={styles.heading}>Linked organisations</Text>
              <View style={styles.chips}>
                {links.length === 0 ? <Text style={styles.none}>No organisations linked.</Text> : null}
                {links.map((l) => (
                  <Chip key={`${l.organisationId}-${l.type}`} onClose={() => { setLinks(links.filter((x) => x !== l)); touched(); }} style={styles.chip} closeIconAccessibilityLabel={`Remove ${l.organisationName} ${TYPE_NAMES[l.type]}`} testID={`link-${l.organisationId}-${l.type}`}>
                    {l.organisationName} · {TYPE_NAMES[l.type]}
                  </Chip>
                ))}
              </View>
              <View style={[styles.addBox, { borderColor: theme.colors.outline }]}>
                <ErrorBanner message={orgs.error?.message} onRetry={orgs.error ? orgs.reload : undefined} testID="orgs-error" />
                <DropdownField label="Organisation" placeholder="Choose an organisation" value={addOrg} options={(orgs.data || []).map((o) => ({ value: o.id, label: o.name }))} onChange={(v) => { setAddOrg(v); setAddError(null); }} testID="add-org" />
                <DropdownField label="Type" placeholder="Organiser or Approver" value={addType} options={TYPE_OPTIONS} onChange={(v) => { setAddType(v); setAddError(null); }} error={addError} testID="add-type" />
                <Button mode="outlined" icon="plus" onPress={addLink} testID="add-link">
                  Add
                </Button>
              </View>

              <View style={styles.activeBox}>
                <SwitchRow label="Account active" disabled={isSelf} value={active} onValueChange={(v) => { setActive(v); touched(); }} testID="user-active-switch" />
                {isSelf ? <HelperText type="info" visible>You cannot deactivate your own account.</HelperText> : null}
              </View>

              <ErrorBanner message={problem?.message} testID="user-save-error" />
              {problem?.fields ? (
                <HelperText type="error" visible>
                  {Object.values(problem.fields).join(' ')}
                </HelperText>
              ) : null}
              {saved ? <ErrorBanner tone="info" message="Changes saved. Role changes apply on the user's next request." testID="user-saved" /> : null}

              <Button mode="contained" onPress={save} loading={saving} disabled={saving} style={styles.save} contentStyle={styles.saveContent} testID="user-save">
                Save changes
              </Button>
              <View style={[styles.note, { borderColor: theme.colors.outline }]}>
                <Text style={styles.noteText}>They cannot log in once deactivated, but their past records remain.</Text>
              </View>
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
  name: { fontWeight: '700' },
  email: { fontSize: 13, marginBottom: 14 },
  heading: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { marginRight: 6, marginBottom: 6 },
  none: { fontSize: 13, marginBottom: 6 },
  addBox: { borderWidth: 1, borderRadius: 4, padding: 12, marginBottom: 8 },
  activeBox: { marginTop: 8 },
  save: { marginTop: 10 },
  saveContent: { height: 46 },
  note: { borderWidth: 1, borderRadius: 4, padding: 10, marginTop: 14 },
  noteText: { fontSize: 12, textAlign: 'center' },
});
