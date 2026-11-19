import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

// Small grey "Logo" square used in lists (placeholder until IBA branding arrives, BR-05).
export default function LogoTile({ size = 48 }) {
  return (
    <View style={[styles.tile, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no">
      <Text style={styles.text}>Logo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: '#DADCE0', alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  text: { fontStyle: 'italic', fontSize: 12, color: '#3C4148' },
});
