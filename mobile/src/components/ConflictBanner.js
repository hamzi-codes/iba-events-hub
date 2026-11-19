import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatDate, formatTime } from '../utils/dates';

// Shown inside the event form, under the Venue, Date and Time fields, when the venue is
// already booked (FR-CNF-02, Master Document 5.10). It names the clashing event.
//   "This venue is already booked for AI in Industry (Data Science Society) from
//    5:00 PM to 7:00 PM on 24 Nov 2026. Please choose another time or venue."
// A message from the server (VENUE_CONFLICT on submit) can be shown here too.
export default function ConflictBanner({ clashingEvent, message, testID }) {
  const text =
    message ||
    (clashingEvent
      ? `This venue is already booked for ${clashingEvent.title} (${clashingEvent.organisationName}) from ${formatTime(clashingEvent.startAt)} to ${formatTime(clashingEvent.endAt)} on ${formatDate(clashingEvent.startAt)}. Please choose another time or venue.`
      : null);
  if (!text) return null;
  return (
    <View style={styles.box} accessibilityRole="alert" testID={testID}>
      <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#5C1410" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FCE8E6',
    borderColor: '#B3261E',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  text: { flex: 1, marginLeft: 10, color: '#5C1410' },
});
