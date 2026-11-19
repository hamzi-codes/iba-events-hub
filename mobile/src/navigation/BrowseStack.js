import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EventDetailsScreen from '../screens/student/EventDetailsScreen';
import HomeScreen from '../screens/student/HomeScreen';
import OrganisationListScreen from '../screens/student/OrganisationListScreen';
import OrganisationPageScreen from '../screens/student/OrganisationPageScreen';

const Stack = createNativeStackNavigator();

// Home > category list > organisation page > event details (screens 5 to 8).
// This is the Home tab for students and the Browse tab for organisers. From Home a student
// reaches an event in 3 taps (NFR-USA-01 allows 5).
export default function BrowseStack() {
  return (
    <Stack.Navigator initialRouteName="BrowseHome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BrowseHome" component={HomeScreen} />
      <Stack.Screen name="OrganisationList" component={OrganisationListScreen} />
      <Stack.Screen name="OrganisationPage" component={OrganisationPageScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}
