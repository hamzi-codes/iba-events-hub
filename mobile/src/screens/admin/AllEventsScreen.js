import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text, useTheme } from 'react-native-paper';

import { getEvents } from '../../api/admin';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import LogoTile from '../../components/LogoTile';
import RoleGate from '../../components/RoleGate';
import ScreenHeader from '../../components/ScreenHeader';
import StatusPill from '../../components/StatusPill';
import useLoad from '../../hooks/useLoad';
import { formatDateTime } from '../../utils/dates';

// Screen 26: All events, read-only (ADM-07). GET /admin/events?status=.
// Search (title or organisation, on the phone) and status chips. Tap an event to see its
// details and history. There are no edit buttons: the admin only watches (decision D5).
const FILTERS = [
  { key: 'ALL', label: 'All', status: undefined },
  { key: 'PENDING', label: 'Pending', status: 'PENDING' },
  { key: 'CHANGES_REQUESTED', label: 'Changes', status: 'CHANGES_REQUESTED' },
  { key: 'APPROVED', label: 'Approved', status: 'APPROVED' },
  { key: 'REJECTED', label: 'Rejected', status: 'REJECTED' },
  { key: 'CANCELLED', label: 'Cancelled', status: 'CANCELLED' },
];

function Content({ navigation }) {
  const theme = useTheme();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const status = FILTERS.find((f) => f.key === filter).status;
  const { data, error, loading, refreshing, reload, refresh } = useLoad(() => getEvents({ status }), [status]);

  const text = search.trim().toLowerCase();
  const shown = (data || []).filter((ev) => !text || ev.title.toLowerCase().includes(text) || (ev.organisationName || '').toLowerCase().includes(text));

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Events" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Searchbar placeholder="Search all events" value={search} onChangeText={setSearch} style={styles.search} inputStyle={styles.searchInput} testID="events-search" />
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <Chip key={f.key} selected={filter === f.key} showSelectedOverlay onPress={() => setFilter(f.key)} style={styles.chip} testID={`events-chip-${f.key}`}>
              {f.label}
            </Chip>
          ))}
        </View>
        <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="events-error" />
        {loading ? <LoadingView message="Loading events" /> : null}
        {!loading && data && shown.length === 0 ? <EmptyState message="No events match. Try a different search or filter." testID="events-empty" /> : null}
        {!loading &&
          shown.map((ev) => (
            <Pressable
              key={ev.id}
              onPress={() => navigation.navigate('AdminEventDetail', { eventId: ev.id })}
              accessibilityRole="button"
              accessibilityLabel={`${ev.title}, ${ev.organisationName}`}
              style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.outlineVariant, opacity: pressed ? 0.6 : 1 }]}
              testID={`event-${ev.id}`}
            >
              <LogoTile size={40} />
              <View style={styles.text}>
                <Text style={styles.name}>{ev.title}</Text>
                <Text style={styles.small}>{ev.organisationName}</Text>
                <Text style={styles.small}>{formatDateTime(ev.startAt)}</Text>
              </View>
              <StatusPill status={ev.status} />
            </Pressable>
          ))}
      </ScrollView>
    </View>
  );
}

export default function AllEventsScreen(props) {
  return (
    <RoleGate roles={['admin']}>
      <Content {...props} />
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  search: { marginBottom: 12, height: 44 },
  searchInput: { minHeight: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: 8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  text: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 15, fontWeight: '700' },
  small: { fontSize: 12, marginTop: 1 },
});
