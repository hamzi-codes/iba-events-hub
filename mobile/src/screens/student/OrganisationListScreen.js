import React, { useMemo } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { getOrganisations } from '../../api/browse';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import LogoTile from '../../components/LogoTile';
import ScreenHeader from '../../components/ScreenHeader';
import useLoad from '../../hooks/useLoad';

// Screen 6: Organisation list (BRW-02). GET /organisations?category=
// Active organisations A to Z with a letter heading. The Follow buttons are Sprint 2.
const upcomingText = (n) => (n > 0 ? `${n} upcoming` : 'No upcoming events');

export default function OrganisationListScreen({ navigation, route }) {
  const theme = useTheme();
  const { category, label } = route.params;
  const { data, error, loading, refreshing, reload, refresh } = useLoad(
    () => getOrganisations({ category }),
    [category]
  );

  const sections = useMemo(() => {
    const groups = {};
    (data || []).forEach((organisation) => {
      const letter = organisation.name.trim().charAt(0).toUpperCase() || '#';
      (groups[letter] = groups[letter] || []).push(organisation);
    });
    return Object.keys(groups)
      .sort()
      .map((letter) => ({ title: letter, data: groups[letter] }));
  }, [data]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={label} onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingView message="Loading" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={<ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="orgs-error" />}
          ListEmptyComponent={
            error ? null : <EmptyState message={`No ${label.toLowerCase()} to show yet. Please check back soon.`} icon="domain" testID="orgs-empty" />
          }
          renderSectionHeader={({ section }) => <Text style={styles.letter}>{section.title}</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('OrganisationPage', { id: item.id, name: item.name })}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${upcomingText(item.upcomingCount)}`}
              style={({ pressed }) => [
                styles.row,
                { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
              ]}
              testID={`org-row-${item.id}`}
            >
              <LogoTile />
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{upcomingText(item.upcomingCount)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  letter: { fontSize: 18, marginTop: 8, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 4, padding: 10, marginBottom: 10 },
  rowText: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700' },
  sub: { marginTop: 2, fontSize: 13 },
});
