import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { getOrganisation, getOrganisationEvents } from '../../api/browse';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import EventCard from '../../components/EventCard';
import LoadingView from '../../components/LoadingView';
import LogoPlaceholder from '../../components/LogoPlaceholder';
import ScreenHeader from '../../components/ScreenHeader';
import useLoad from '../../hooks/useLoad';

// Screen 7: Organisation page (BRW-03, 04, 07).
// GET /organisations/:id and GET /organisations/:id/events?when=
// Banner, description, Upcoming and Past tabs, event rows. Upcoming is soonest first,
// Past is latest first (the server sorts). The Follow button and "Slots left" tags are
// Sprint 2. Past events are never removed (BRW-07).
const TABS = [
  { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming events yet. Check back soon.' },
  { key: 'past', label: 'Past', empty: 'No past events to show.' },
];

export default function OrganisationPageScreen({ navigation, route }) {
  const theme = useTheme();
  const { id, name } = route.params;
  const [tab, setTab] = useState('upcoming');

  const organisation = useLoad(() => getOrganisation(id), [id]);
  const events = useLoad(() => getOrganisationEvents(id, { when: tab }), [id, tab]);

  const activeTab = TABS.find((t) => t.key === tab);
  const description = organisation.data?.description;

  const header = (
    <View>
      <LogoPlaceholder label="Banner" height={90} />
      {description ? <Text style={styles.description}>{description}</Text> : <View style={styles.gap} />}
      <ErrorBanner message={organisation.error?.message} onRetry={organisation.error ? organisation.reload : undefined} testID="org-error" />
      <View style={[styles.tabs, { borderBottomColor: theme.colors.outline }]}>
        {TABS.map((t) => {
          const selected = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.tab, selected && { borderBottomColor: theme.colors.primary }]}
              testID={`org-tab-${t.key}`}
            >
              <Text style={[styles.tabText, selected && { fontWeight: '700', color: theme.colors.primary }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <ErrorBanner message={events.error?.message} onRetry={events.error ? events.reload : undefined} testID="events-error" />
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={organisation.data?.name || name} onBack={() => navigation.goBack()} />
      <FlatList
        data={events.loading ? [] : events.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={events.refreshing}
            onRefresh={() => {
              events.refresh();
              organisation.refresh();
            }}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          events.loading ? (
            <LoadingView message="Loading events" />
          ) : events.error ? null : (
            <EmptyState message={activeTab.empty} testID="events-empty" />
          )
        }
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => navigation.navigate('EventDetails', { eventId: item.id })} testID={`event-card-${item.id}`} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  description: { marginVertical: 12, fontSize: 15 },
  gap: { height: 12 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 14 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 16 },
});
