import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EventFormProvider } from '../context/EventFormContext';
import EditEventScreen from '../screens/organiser/EditEventScreen';
import NewEventBasicsScreen from '../screens/organiser/NewEventBasicsScreen';
import NewEventDetailsScreen from '../screens/organiser/NewEventDetailsScreen';
import NewEventReviewScreen from '../screens/organiser/NewEventReviewScreen';
import SubmissionDetailScreen from '../screens/organiser/SubmissionDetailScreen';
import SubmissionsScreen from '../screens/organiser/SubmissionsScreen';

const Stack = createNativeStackNavigator();

// Organiser screens 9 to 15, inside the Submissions tab:
//   My submissions > Submission detail > Edit        (screens 9, 13, 14; cancel sheet is 15)
//   My submissions > New event 1 of 2 > 2 of 2 > Review   (screens 10, 11, 12)
// EventFormProvider keeps what was typed while moving between the form steps.
export default function SubmissionsStack() {
  return (
    <EventFormProvider>
      <Stack.Navigator initialRouteName="SubmissionsHome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SubmissionsHome" component={SubmissionsScreen} />
        <Stack.Screen name="SubmissionDetail" component={SubmissionDetailScreen} />
        <Stack.Screen name="EditEvent" component={EditEventScreen} />
        <Stack.Screen name="NewEventBasics" component={NewEventBasicsScreen} />
        <Stack.Screen name="NewEventDetails" component={NewEventDetailsScreen} />
        <Stack.Screen name="NewEventReview" component={NewEventReviewScreen} />
      </Stack.Navigator>
    </EventFormProvider>
  );
}
