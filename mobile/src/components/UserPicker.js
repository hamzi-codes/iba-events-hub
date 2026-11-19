import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import { getUsers } from '../api/admin';

// "Type an email and pick from matches" (screen 24). Chosen accounts show as chips with an x.
// onChange receives the whole list: [{ id, fullName, email }].
export default function UserPicker({ label, hint, selected, onChange, error, testID }) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Look up accounts about 300 ms after the last key, once there are 2 characters.
  useEffect(() => {
    const query = text.trim();
    setSearchError(null);
    if (query.length < 2) {
      setMatches([]);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const list = await getUsers({ search: query, status: 'active' });
        if (!cancelled) setMatches(list.slice(0, 20));
      } catch (e) {
        if (!cancelled) setSearchError(e.message);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  const chosen = new Set(selected.map((u) => u.id));
  const shown = matches.filter((u) => !chosen.has(u.id)).slice(0, 5);
  const add = (user) => {
    onChange([...selected, { id: user.id, fullName: user.fullName, email: user.email }]);
    setText('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.chips}>
        {selected.map((u) => (
          <Chip key={u.id} onClose={() => onChange(selected.filter((x) => x.id !== u.id))} style={styles.chip} closeIconAccessibilityLabel={`Remove ${u.fullName}`} testID={`${testID}-chip-${u.id}`}>
            {u.email}
          </Chip>
        ))}
      </View>
      <TextInput
        mode="outlined"
        dense
        value={text}
        onChangeText={setText}
        placeholder="Type a name or email"
        placeholderTextColor="#8A919C"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        error={!!error}
        accessibilityLabel={label}
        testID={`${testID}-input`}
      />
      {text.trim().length >= 2 ? (
        <View style={[styles.results, { borderColor: theme.colors.outline }]} testID={`${testID}-results`}>
          {searching ? <Text style={styles.note}>Searching...</Text> : null}
          {searchError ? <Text style={[styles.note, { color: theme.colors.error }]}>{searchError}</Text> : null}
          {!searching && !searchError && shown.length === 0 ? <Text style={styles.note}>No matching accounts.</Text> : null}
          {shown.map((u) => (
            <Pressable key={u.id} onPress={() => add(u)} accessibilityRole="button" accessibilityLabel={`Add ${u.fullName}, ${u.email}`} style={styles.result} testID={`${testID}-match-${u.id}`}>
              <Text style={styles.resultName}>{u.fullName}</Text>
              <Text style={styles.resultEmail}>{u.email}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : hint ? (
        <HelperText type="info" visible>
          {hint}
        </HelperText>
      ) : (
        <View style={{ height: 8 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 2 },
  label: { marginBottom: 4, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: 6, marginBottom: 6 },
  results: { borderWidth: 1, borderRadius: 4, marginTop: 4, backgroundColor: '#FFFFFF' },
  result: { paddingVertical: 10, paddingHorizontal: 12 },
  resultName: { fontWeight: '600' },
  resultEmail: { fontSize: 12 },
  note: { padding: 12, fontSize: 13 },
});
