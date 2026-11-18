import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import ErrorBanner from '../../components/ErrorBanner';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';

// Screen 4: Profile (FR-AUT-04). Same screen for every role.
// Shows name, email (read only), role or roles, and Log Out.
// GET /auth/me runs each time the tab opens, so a role changed by an admin shows up
// without logging out again (Section 6.6). POST /auth/logout runs inside logout().
// "Change password" and the notification switches are Sprint 2, so they are not shown.

const ROLE_LABELS = {
  student: 'Student',
  organiser: 'Event organiser',
  approver: 'Approving authority',
  admin: 'System administrator',
};

// Every user is also a student, so only show "Student" when it is the only role.
function describeRoles(roles = []) {
  const higher = roles.filter((role) => role !== 'student');
  const shown = higher.length > 0 ? higher : ['student'];
  return shown.map((role) => ROLE_LABELS[role] || role).join(', ');
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, refreshUser, logout } = useAuth();
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      await refreshUser();
    } catch (e) {
      // The details already on screen stay. A 401 is handled by the API client (back to Login).
      setError(e.message);
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout(); // the root navigator then shows Login
  }

  if (!user) return null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="Profile" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} onRetry={load} testID="profile-error" />
        <FormField label="Full Name" value={user.fullName} editable={false} testID="profile-name" />
        <FormField label="Email" value={user.email} editable={false} testID="profile-email" />
        <FormField label="Role" value={describeRoles(user.roles)} editable={false} testID="profile-role" />
        <Button
          mode="outlined"
          onPress={handleLogout}
          loading={loggingOut}
          disabled={loggingOut}
          style={styles.logout}
          testID="profile-logout"
        >
          Log Out
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  logout: { marginTop: 16 },
});
