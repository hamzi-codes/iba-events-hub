import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

// Grey box with "LOGO", as drawn in the wireframes. Replace with the real IBA logo when the
// branding files arrive (BR-05, logged in docs/deviations.md). Also used for the envelope
// picture on Verify email (label="Envelope").
export default function LogoPlaceholder({ label = 'LOGO', height = 120 }) {
  return (
    <View style={[styles.box, { height }]} accessibilityLabel={`${label} placeholder`}>
      <View style={styles.badge}>
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#DADCE0', alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  badge: { backgroundColor: '#B9BCC2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  text: { fontStyle: 'italic', fontWeight: '700', fontSize: 18, color: '#2B2F36' },
});
