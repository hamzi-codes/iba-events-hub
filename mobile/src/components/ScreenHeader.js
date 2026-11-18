import React from 'react';
import { Appbar, Text, useTheme } from 'react-native-paper';

// Header bar as drawn in the wireframes: optional back arrow, then the title on the left,
// and optional text on the right (for example "Step 1 of 2").
// The bell and heart icons in the wireframes are Sprint 2, so they are not shown.
export default function ScreenHeader({ title, onBack, right }) {
  const theme = useTheme();
  return (
    <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
      {onBack ? <Appbar.BackAction onPress={onBack} /> : null}
      <Appbar.Content title={title} titleStyle={{ fontWeight: '700' }} />
      {right ? <Text style={{ marginRight: 16 }}>{right}</Text> : null}
    </Appbar.Header>
  );
}
