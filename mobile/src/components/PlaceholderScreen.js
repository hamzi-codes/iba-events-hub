import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';

// Stand-in for screens that are not built yet. Each one is replaced, one at a time,
// by the real screen from Section 7.3. The dev-only Log Out button lets you test the
// session until the Profile screen (screen 4) exists.
export default function PlaceholderScreen({ title, screenNumber, note }) {
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text variant="headlineSmall">{title}</Text>
      <Text style={styles.text}>Not built yet (Section 7.3, screen {screenNumber}).</Text>
      {note ? <Text style={styles.text}>{note}</Text> : null}
      {__DEV__ && user ? (
        <>
          <Text style={styles.text}>
            Logged in as {user.fullName} ({user.roles.join(', ')}).
          </Text>
          <Button mode="outlined" onPress={logout} style={styles.button}>
            Log out (dev only)
          </Button>
        </>
      ) : null}
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
  button: { marginTop: 24, alignSelf: 'flex-start' },
});
