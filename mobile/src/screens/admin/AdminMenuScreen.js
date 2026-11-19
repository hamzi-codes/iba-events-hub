import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import RoleGate from '../../components/RoleGate';
import ScreenHeader from '../../components/ScreenHeader';

// Screen 20: Admin menu (AUT-07). No API call. Only an admin ever sees this tab.
// Notification wording and Delivery failures are Sprint 2. Configuration is added when built.
const ITEMS = [
  { route: 'Users', label: 'Users', icon: 'account-multiple-outline' },
  { route: 'Organisations', label: 'Organisations', icon: 'domain' },
  { route: 'Venues', label: 'Venues', icon: 'map-marker-outline' },
];

function Content({ navigation }) {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Admin" />
      <View style={styles.list}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.outlineVariant, opacity: pressed ? 0.6 : 1 }]}
            testID={`admin-menu-${item.route}`}
          >
            <MaterialCommunityIcons name={item.icon} size={24} color={theme.colors.onSurface} />
            <Text style={styles.label}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurface} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function AdminMenuScreen(props) {
  return (
    <RoleGate roles={['admin']}>
      <Content {...props} />
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
  label: { flex: 1, marginLeft: 14, fontSize: 16 },
});
