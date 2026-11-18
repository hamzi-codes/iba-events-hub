import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getCategories } from '../../api/browse';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import LogoTile from '../../components/LogoTile';
import ScreenHeader from '../../components/ScreenHeader';
import useLoad from '../../hooks/useLoad';

// Screen 5: Home (BRW-01, BRW-06). GET /categories.
// Three cards: Societies, Schools, Departments, each with the number of organisations.
// The search bar and the bell are Sprint 2, so they are not shown.
const countText = (n) => `${n} ${n === 1 ? 'organisation' : 'organisations'}`;

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { data, error, loading, refreshing, reload, refresh } = useLoad(() => getCategories(), []);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="IBA Events" />
      {loading ? (
        <LoadingView message="Loading" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="home-error" />
          {data && data.length === 0 ? (
            <EmptyState message="There is nothing to browse yet. Please check back soon." testID="home-empty" />
          ) : null}
          {data && data.length > 0 ? <Text style={styles.browseBy}>Browse by:</Text> : null}
          {(data || []).map((category) => (
            <Pressable
              key={category.key}
              onPress={() => navigation.navigate('OrganisationList', { category: category.key, label: category.label })}
              accessibilityRole="button"
              accessibilityLabel={`${category.label}, ${countText(category.organisationCount)}`}
              style={({ pressed }) => [
                styles.card,
                { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
              ]}
              testID={`home-card-${category.key}`}
            >
              <LogoTile size={56} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{category.label}</Text>
                <Text style={styles.cardSub}>{countText(category.organisationCount)}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.onSurface} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  browseBy: { fontSize: 16, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  cardText: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSub: { marginTop: 2 },
});
