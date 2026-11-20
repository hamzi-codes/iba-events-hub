import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';

import { getDecided } from '../../api/approvals';
import DateTimeField from '../../components/DateTimeField';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import LogoTile from '../../components/LogoTile';
import RoleGate from '../../components/RoleGate';
import ScreenHeader from '../../components/ScreenHeader';
import useLoad from '../../hooks/useLoad';
import { formatDate, toDateString } from '../../utils/dates';

// Screen 19: Decided events (APR-10). GET /approvals/decided?decision=&from=&to=.
// A read-only history of past decisions, with chips for the decision and a date range.
const FILTERS = [
  { key: 'ALL', label: 'All', decision: undefined },
  { key: 'APPROVED', label: 'Approved', decision: 'APPROVED' },
  { key: 'REJECTED', label: 'Rejected', decision: 'REJECTED' },
  { key: 'CHANGES_REQUESTED', label: 'Changes', decision: 'CHANGES_REQUESTED' },
];
const DECISION_WORDS = {
  APPROVED: { pill: 'Approved', date: 'Approved', bg: '#DDF3E4', fg: '#14502B' },
  REJECTED: { pill: 'Rejected', date: 'Rejected', bg: '#FCE8E6', fg: '#5C1410' },
  CHANGES_REQUESTED: { pill: 'Changes', date: 'Changes asked', bg: '#FFE5D0', fg: '#6E3200' },
};

// Works with the shape in api/approvals.js, and falls back to history or status if the API
// leaves out decision and decidedAt.
function decisionOf(item) {
  const decision = typeof item.decision === 'string' ? item.decision : item.decision?.status;
  if (decision) return { decision, at: item.decidedAt || item.decision?.decidedAt };
  const entries = (item.history || []).filter((h) => h.actorRole === 'approver');
  const last = entries[entries.length - 1];
  return last ? { decision: last.toStatus, at: last.createdAt } : { decision: item.status, at: item.updatedAt };
}

function Content({ navigation, route }) {
  const theme = useTheme();
  const [filter, setFilter] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const badRange = !!from && !!to && from > to;
  const decision = FILTERS.find((f) => f.key === filter).decision;

  const { data, error, loading, refreshing, reload, refresh } = useLoad(
    () => (badRange ? Promise.resolve([]) : getDecided({ decision, from: from || undefined, to: to || undefined })),
    [decision, from, to, badRange]
  );
  // Back arrow only when this screen was pushed (from the Queue link), not when it is a tab's first screen.
  const canGoBack = navigation.getState().index > 0;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Decided" onBack={canGoBack ? () => navigation.goBack() : undefined} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.chips}>
          {FILTERS.map((item) => (
            <Chip key={item.key} selected={filter === item.key} showSelectedOverlay onPress={() => setFilter(item.key)} style={styles.chip} testID={`decided-chip-${item.key}`}>
              {item.label}
            </Chip>
          ))}
        </View>
        <View style={styles.dates}>
          <View style={styles.half}>
            <DateTimeField label="From" mode="date" allowPast placeholder="Date" value={from} onChange={setFrom} testID="decided-from" />
          </View>
          <View style={styles.half}>
            <DateTimeField label="To" mode="date" allowPast placeholder="Date" value={to} onChange={setTo} error={badRange ? 'To must be on or after From.' : undefined} testID="decided-to" />
          </View>
        </View>
        {from || to ? (
          <Button
            mode="text"
            compact
            onPress={() => {
              setFrom('');
              setTo('');
            }}
            style={styles.clear}
            testID="decided-clear"
          >
            Clear dates
          </Button>
        ) : null}

        <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="decided-error" />
        {loading ? <LoadingView message="Loading" /> : null}
        {!loading && data && data.length === 0 && !badRange ? (
          <EmptyState icon="check-decagram-outline" message="No decisions match these filters." testID="decided-empty" />
        ) : null}
        {!loading &&
          (data || []).map((item) => {
            const { decision: kind, at } = decisionOf(item);
            const words = DECISION_WORDS[kind] || { pill: kind, date: 'Decided', bg: '#E6E8EB', fg: '#2F343A' };
            return (
              <Pressable
                key={item.id}
                onPress={() => navigation.navigate('ReviewSubmission', { eventId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${words.pill}`}
                style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.outlineVariant, opacity: pressed ? 0.6 : 1 }]}
                testID={`decided-${item.id}`}
              >
                <LogoTile size={44} />
                <View style={styles.text}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.small}>{item.organisationName}</Text>
                  <Text style={styles.small}>
                    {words.date} {at ? formatDate(at) : ''}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: words.bg }]}>
                  <Text style={[styles.pillText, { color: words.fg }]}>{words.pill}</Text>
                </View>
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

export default function DecidedScreen(props) {
  return (
    <RoleGate roles={['approver']}>
      <Content {...props} />
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: 8, marginBottom: 8 },
  dates: { flexDirection: 'row', gap: 12, marginTop: 4 },
  half: { flex: 1 },
  clear: { alignSelf: 'flex-start', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  text: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '700' },
  small: { fontSize: 12, marginTop: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '600' },
});
