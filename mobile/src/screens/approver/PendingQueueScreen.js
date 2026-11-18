import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { getPending } from '../../api/approvals';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import LogoTile from '../../components/LogoTile';
import RoleGate from '../../components/RoleGate';
import ScreenHeader from '../../components/ScreenHeader';
import useLoad from '../../hooks/useLoad';
import { formatDateTime } from '../../utils/dates';

// Screen 16: Pending queue (APR-02). GET /approvals/pending.
// "Pending (n)", oldest first, event name and organisation. The search bar and the conflict
// tag in the wireframe are not in Sprint 1.
function Content({ navigation, route }) {
  const theme = useTheme();
  const notice = route.params?.notice;
  const showDecidedLink = !!route.params?.showDecidedLink;
  const { data, error, loading, refreshing, reload, refresh } = useLoad(() => getPending(), []);
  const events = data?.events || [];

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={data ? `Pending (${data.total})` : 'Pending'} />
      {loading ? (
        <LoadingView message="Loading the queue" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          {notice ? <ErrorBanner tone="info" message={notice} testID="queue-notice" /> : null}
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="queue-error" />
          {data && events.length === 0 ? <EmptyState icon="inbox-outline" message="Nothing is waiting for your decision." testID="queue-empty" /> : null}
          {events.map((ev) => (
            <Pressable
              key={ev.id}
              onPress={() => navigation.navigate('ReviewSubmission', { eventId: ev.id })}
              accessibilityRole="button"
              accessibilityLabel={`${ev.title}, ${ev.organisationName}`}
              style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.outlineVariant, opacity: pressed ? 0.6 : 1 }]}
              testID={`queue-${ev.id}`}
            >
              <LogoTile />
              <View style={styles.text}>
                <Text style={styles.title}>{ev.title}</Text>
                <Text style={styles.small}>{ev.organisationName}</Text>
                <Text style={styles.small}>{formatDateTime(ev.startAt)}</Text>
              </View>
            </Pressable>
          ))}
          {showDecidedLink ? (
            <Button mode="text" icon="check-decagram-outline" onPress={() => navigation.navigate('DecidedHome')} style={styles.link} testID="open-decided">
              Decided events
            </Button>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

export default function PendingQueueScreen(props) {
  return (
    <RoleGate roles={['approver']}>
      <Content {...props} />
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  text: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  small: { fontSize: 12, marginTop: 1 },
  link: { marginTop: 12, alignSelf: 'center' },
});
