import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getUsers } from '../../api/admin';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingView from '../../components/LoadingView';
import LogoTile from '../../components/LogoTile';
import ScreenHeader from '../../components/ScreenHeader';
import useLoad from '../../hooks/useLoad';

// Screen 21: Users (ADM-01). GET /admin/users?search=&role=&status=.
// Search by name or email (about 300 ms after the last key), role chips, status chips.
const ROLE_FILTERS = [
  { key: 'ALL', label: 'All roles', role: undefined },
  { key: 'student', label: 'Student', role: 'student' },
  { key: 'organiser', label: 'Organiser', role: 'organiser' },
  { key: 'approver', label: 'Approver', role: 'approver' },
  { key: 'admin', label: 'Admin', role: 'admin' },
];
const STATUS_FILTERS = [
  { key: 'ALL', label: 'All', status: undefined },
  { key: 'active', label: 'Active', status: 'active' },
  { key: 'inactive', label: 'Inactive', status: 'inactive' },
];
const ROLE_NAMES = { student: 'Student', organiser: 'Organiser', approver: 'Approver', admin: 'Admin' };

export const describeUser = (u) => {
  const roles = ['admin', 'approver', 'organiser', 'student'].filter((r) => u.roles.includes(r)).map((r) => ROLE_NAMES[r]);
  const shownRoles = roles.length > 1 ? roles.filter((r) => r !== 'Student') : roles;
  const orgs = [...new Set((u.affiliations || []).map((a) => a.organisationName))];
  return `${shownRoles.join(', ')}${orgs.length ? ` · ${orgs.join(', ')}` : ''} · ${u.isActive ? 'active' : 'inactive'}`;
};

export default function UsersScreen({ navigation }) {
  const theme = useTheme();
  const [typed, setTyped] = useState('');
  const [search, setSearch] = useState('');
  const [roleKey, setRoleKey] = useState('ALL');
  const [statusKey, setStatusKey] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(typed.trim()), 300);
    return () => clearTimeout(timer);
  }, [typed]);

  const role = ROLE_FILTERS.find((f) => f.key === roleKey).role;
  const status = STATUS_FILTERS.find((f) => f.key === statusKey).status;
  const { data, error, loading, refreshing, reload, refresh } = useLoad(() => getUsers({ search, role, status }), [search, role, status]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Users" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Searchbar placeholder="Search name or email" value={typed} onChangeText={setTyped} style={styles.search} inputStyle={styles.searchInput} testID="users-search" />
        <View style={styles.chips}>
          {ROLE_FILTERS.map((f) => (
            <Chip key={f.key} selected={roleKey === f.key} showSelectedOverlay onPress={() => setRoleKey(f.key)} style={styles.chip} testID={`users-role-${f.key}`}>
              {f.label}
            </Chip>
          ))}
        </View>
        <View style={styles.chips}>
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.key} selected={statusKey === f.key} showSelectedOverlay onPress={() => setStatusKey(f.key)} style={styles.chip} testID={`users-status-${f.key}`}>
              {f.label}
            </Chip>
          ))}
        </View>
        <ErrorBanner message={error?.message} onRetry={error ? reload : undefined} testID="users-error" />
        {loading ? <LoadingView message="Loading users" /> : null}
        {!loading && data && data.length === 0 ? <EmptyState icon="account-search-outline" message="No users match. Try a different search or filter." testID="users-empty" /> : null}
        {!loading &&
          (data || []).map((u) => (
            <Pressable
              key={u.id}
              onPress={() => navigation.navigate('UserDetail', { userId: u.id })}
              accessibilityRole="button"
              accessibilityLabel={`${u.fullName}, ${u.email}`}
              style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.outlineVariant, opacity: pressed ? 0.6 : 1 }]}
              testID={`user-${u.id}`}
            >
              <LogoTile size={40} />
              <View style={styles.text}>
                <Text style={styles.name}>{u.fullName}</Text>
                <Text style={styles.small}>{u.email}</Text>
                <Text style={styles.small}>{describeUser(u)}</Text>
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
  search: { marginBottom: 12, height: 44 },
  searchInput: { minHeight: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: 8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  text: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700' },
  small: { fontSize: 12, marginTop: 1 },
});
