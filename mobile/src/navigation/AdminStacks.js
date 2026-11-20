import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminEventDetailScreen from '../screens/admin/AdminEventDetailScreen';
import AdminMenuScreen from '../screens/admin/AdminMenuScreen';
import AllEventsScreen from '../screens/admin/AllEventsScreen';
import OrganisationFormScreen from '../screens/admin/OrganisationFormScreen';
import OrganisationsScreen from '../screens/admin/OrganisationsScreen';
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import VenuesScreen from '../screens/admin/VenuesScreen';

const MenuStack = createNativeStackNavigator();
const EventsStack = createNativeStackNavigator();

// Admin tab: menu (20) > Users (21) > User detail (22); Organisations (23) > form (24); Venues (25).
export function AdminMenuStack() {
  return (
    <MenuStack.Navigator initialRouteName="AdminMenu" screenOptions={{ headerShown: false }}>
      <MenuStack.Screen name="AdminMenu" component={AdminMenuScreen} />
      <MenuStack.Screen name="Users" component={UsersScreen} />
      <MenuStack.Screen name="UserDetail" component={UserDetailScreen} />
      <MenuStack.Screen name="Organisations" component={OrganisationsScreen} />
      <MenuStack.Screen name="OrganisationForm" component={OrganisationFormScreen} />
      <MenuStack.Screen name="Venues" component={VenuesScreen} />
    </MenuStack.Navigator>
  );
}

// Events tab: All events (26) > event with history.
export function AdminEventsStack() {
  return (
    <EventsStack.Navigator initialRouteName="AllEvents" screenOptions={{ headerShown: false }}>
      <EventsStack.Screen name="AllEvents" component={AllEventsScreen} />
      <EventsStack.Screen name="AdminEventDetail" component={AdminEventDetailScreen} />
    </EventsStack.Navigator>
  );
}
