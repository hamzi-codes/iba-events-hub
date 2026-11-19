import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, FAB, useTheme } from 'react-native-paper';

import { getMyEvents } from '../../api/events';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import EventCard from '../../components/EventCard';
import LoadingView from '../../components/LoadingView';
import RoleGate from '../../components/RoleGate';
import ScreenHeader from '../../components/ScreenHeader';
import StatusPill from '../../components/StatusPill';
import { useEventForm } from '../../context/EventFormContext';
import useLoad from '../../hooks/useLoad';

// Screen 9: My submissions (SUB-07). GET /my/events.
// Status chips and a + button. No Draft chip in Sprint 1.
const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CHANGES_REQUESTED', label: 'Changes' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'APPROVED', label: 'Approved' },
];
const EMPTY_TEXT = {
  ALL: 'You have not submitted any events yet. Tap + to create one.',
  PENDING: 'No events are waiting for approval.',
  CHANGES_REQUESTED: 'No events need changes.',
  REJECTED: 'No events have been rejected.',
  CANCELLED: 'No events have been cancelled.',
  APPROVED: 'No events have been approved yet.',
};

function Content({ navigation }) {
  const theme = useTheme();
  const { startNew } = useEventForm();
  const [filter, setFilter] = useState('ALL');
  const { data, error, loading, refreshing, reload, refresh } = useLoad(() => getMyEvents(), []);

  const shown = useMemo(() => (data || []).filter((ev) => filter === 'ALL' || ev.status === filter), [data, filter]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Submissions" />
      {loading ? (
        <LoadingView message="Loading your submissions" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="submissions-error" />
          <View style={styles.chips}>
            {FILTERS.map((item) => (
              <Chip
                key={item.key}
                selected={filter === item.key}
                showSelectedOverlay
                onPress={() => setFilter(item.key)}
                style={styles.chip}
                accessibilityLabel={`Show ${item.label}`}
                testID={`chip-${item.key}`}
              >
                {item.label}
              </Chip>
            ))}
          </View>
          {data && shown.length === 0 ? <EmptyState message={EMPTY_TEXT[filter]} testID="submissions-empty" /> : null}
          {shown.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              right={<StatusPill status={ev.status} />}
              onPress={() => navigation.navigate('SubmissionDetail', { eventId: ev.id })}
              testID={`submission-${ev.id}`}
            />
          ))}
        </ScrollView>
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        accessibilityLabel="New event"
        onPress={() => {
          startNew();
          navigation.navigate('NewEventBasics');
        }}
        testID="fab-new-event"
      />
    </View>
  );
}

export default function SubmissionsScreen(props) {
  return (
    <RoleGate roles={['organiser']}>
      <Content {...props} />
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { marginRight: 8, marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
