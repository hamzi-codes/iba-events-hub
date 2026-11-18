import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Stand-in for screens that are not built yet. Each one is replaced, one at a time,
// by the real screen from Section 7.3.
export default function PlaceholderScreen({ title, screenNumber, note }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text variant="headlineSmall">{title}</Text>
      <Text style={styles.text}>Not built yet (Section 7.3, screen {screenNumber}).</Text>
      {note ? <Text style={styles.text}>{note}</Text> : null}
    </View>
  );
}

export const placeholder = (title, screenNumber, note) =>
  function Placeholder() {
    return <PlaceholderScreen title={title} screenNumber={screenNumber} note={note} />;
  };

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  text: { marginTop: 12 },
});
