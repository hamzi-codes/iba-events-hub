import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DecidedScreen from '../screens/approver/DecidedScreen';
import PendingQueueScreen from '../screens/approver/PendingQueueScreen';
import ReviewSubmissionScreen from '../screens/approver/ReviewSubmissionScreen';

// Approver screens 16 to 19. Both the Queue tab and the Decided tab use the same three
// screens and only start on a different one, so opening an event always works the same.
// For a user who is both organiser and approver, the Queue tab shows a "Decided events"
// link instead of a separate tab (Section 7.2).
export default function createApproverStack(initialRouteName, { showDecidedLink = false } = {}) {
  const Stack = createNativeStackNavigator();
  return function ApproverStack() {
    return (
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PendingQueue" component={PendingQueueScreen} initialParams={{ showDecidedLink }} />
        <Stack.Screen name="DecidedHome" component={DecidedScreen} />
        <Stack.Screen name="ReviewSubmission" component={ReviewSubmissionScreen} />
      </Stack.Navigator>
    );
  };
}
