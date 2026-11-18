import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoadingView from '../components/LoadingView';
import { useAuth } from '../context/AuthContext';
import AdminTabs from './AdminTabs';
import ApproverTabs from './ApproverTabs';
import AuthStack from './AuthStack';
import MultiRoleTabs from './MultiRoleTabs';
import OrganiserTabs from './OrganiserTabs';
import StudentTabs from './StudentTabs';
import { getHomeRoute } from './roleHome';

const Stack = createNativeStackNavigator();

const TABS = { AdminTabs, ApproverTabs, MultiRoleTabs, OrganiserTabs, StudentTabs };

// Logged out: the auth screens. Logged in: the tabs for the user's roles.
// Detail screens (event details, forms, etc.) will be added as extra Stack.Screen
// entries inside the logged-in branch as they are built.
export default function RootNavigator() {
  const { user, booting } = useAuth();

  if (booting) return <LoadingView message="Loading IBA Events Hub" />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={TABS[getHomeRoute(user)]} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
