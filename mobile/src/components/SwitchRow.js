import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';

// A yes/no choice as a switch, with an optional line of help text under the label.
export default function SwitchRow({ label, hint, value, onValueChange, testID }) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} testID={testID} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  text: { flex: 1, paddingRight: 12 },
  label: { fontSize: 15 },
  hint: { fontSize: 12, marginTop: 2 },
});
