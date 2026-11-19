import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getOrganisations } from '../../api/admin';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import ScreenHeader from '../../components/ScreenHeader';
import useLoad from '../../hooks/useLoad';

// Screen 23: Organisations (ADM-03, 04). GET /admin/organisations?category=&includeInactive=true.
// Tabs Societies, Schools, Departments. Active and inactive are in one list. "+ New" adds one.
const TABS = [
  { key: 'society', label: 'Societies' },
  { key: 'school', label: 'Schools' },
  { key: 'department', label: 'Departments' },
];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function OrganisationsScreen({ navigation, route }) {
  const theme = useTheme();
  const notice = route.params?.notice;
  const [category, setCategory] = useState('society');
  const { data, error, loading, refreshing, reload, refresh } = useLoad(() => getOrganisations({ category, includeInactive: true }), [category]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Organisations" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.top}>
          <View style={styles.chips}>
            {TABS.map((tab) => (
              <Chip key={tab.key} selected={category === tab.key} showSelectedOverlay onPress={() => setCategory(tab.key)} style={styles.chip} testID={`orgs-tab-${tab.key}`}>
                {tab.label}
              </Chip>
            ))}
          </View>
        </View>
        <Button mode="outlined" icon="plus" onPress={() => navigation.navigate('OrganisationForm', { category })} style={styles.new} testID="orgs-new">
          New
        </Button>
        {notice ? <ErrorBanner tone="info" message={notice} testID="orgs-notice" /> : null}
        <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="orgs-error" />
        {loading ? <LoadingView message="Loading organisations" /> : null}
        {!loading && data && data.length === 0 ? <EmptyState icon="domain" message="No organisations here yet. Tap New to add one." testID="orgs-empty" /> : null}
        {!loading &&
          (data || []).map((o) => (
            <Pressable
              key={o.id}
              onPress={() => navigation.navigate('OrganisationForm', { organisationId: o.id, category: o.category })}
              accessibilityRole="button"
              accessibilityLabel={`${o.name}${o.isActive ? '' : ', inactive'}`}
              style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.outlineVariant, opacity: pressed ? 0.6 : 1 }]}
              testID={`org-${o.id}`}
            >
              <View style={styles.text}>
                <Text style={styles.name}>{o.name}</Text>
                <Text style={styles.small}>
                  {o.isActive ? `${plural(o.organiserCount ?? o.organisers?.length ?? 0, 'organiser')} · ${plural(o.approverCount ?? o.approvers?.length ?? 0, 'approver')}` : 'Inactive'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurface} />
            </Pressable>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  top: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  chip: { marginRight: 8, marginBottom: 8 },
  new: { alignSelf: 'flex-end', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  small: { fontSize: 12, marginTop: 2 },
});
