import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Builds a bottom tab navigator from a list of { name, label, icon, component }.
// Sprint 1 shows only the tabs that work (Master Document 7.2, 3.5).
export default function createRoleTabs(tabs) {
  const Tab = createBottomTabNavigator();
  return function RoleTabs() {
    const theme = useTheme();
    return (
      <Tab.Navigator
        screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary }}
      >
        {tabs.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              title: tab.label,
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name={tab.icon} color={color} size={size} />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    );
  };
}
