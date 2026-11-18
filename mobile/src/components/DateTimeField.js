import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatDateString, formatTimeString, todayString } from '../utils/dates';

// A date or time box. The value is plain text in Pakistan time: "2026-11-24" or "17:00".
// Android shows its own picker dialog, iPhone shows a spinner in a dialog (Done to confirm).
// The web branch (a normal HTML input) only exists so the screens can be previewed in a
// browser. The picker reads and writes the wall-clock numbers, so the phone's own time zone
// never changes the value.
const NativePicker = Platform.OS === 'web' ? null : require('@react-native-community/datetimepicker').default;

const pad = (n) => String(n).padStart(2, '0');

function toPickerDate(mode, value) {
  const now = new Date();
  if (mode === 'date') {
    const [y, m, d] = (value || todayString()).split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const [h, min] = (value || '09:00').split(':').map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min, 0);
}

function fromPickerDate(mode, date) {
  return mode === 'date'
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DateTimeField({ label, mode, value, onChange, error, placeholder, minDate, testID }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null); // iPhone: value chosen but not confirmed yet
  const shown = value ? (mode === 'date' ? formatDateString(value) : formatTimeString(value)) : null;
  const min = minDate || (mode === 'date' ? todayString() : undefined);

  const boxStyle = [
    styles.box,
    { borderColor: error ? theme.colors.error : theme.colors.outline, backgroundColor: theme.colors.surface },
  ];

  let field;
  if (Platform.OS === 'web') {
    field = (
      <input
        type={mode}
        value={value || ''}
        min={mode === 'date' ? min : undefined}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        data-testid={testID}
        style={{ height: 44, fontSize: 16, padding: '0 12px', borderRadius: 4, border: `1px solid ${error ? theme.colors.error : theme.colors.outline}`, width: '100%', boxSizing: 'border-box' }}
      />
    );
  } else {
    const onNativeChange = (event, date) => {
      if (Platform.OS === 'android') {
        setOpen(false);
        if (event.type === 'set' && date) onChange(fromPickerDate(mode, date));
      } else if (date) {
        setDraft(fromPickerDate(mode, date));
      }
    };
    field = (
      <>
        <Pressable
          onPress={() => {
            setDraft(value || null);
            setOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${shown || 'Not chosen'}`}
          style={boxStyle}
          testID={testID}
        >
          <Text style={[styles.value, !shown && { color: '#8A919C' }]}>{shown || placeholder}</Text>
          <MaterialCommunityIcons name={mode === 'date' ? 'calendar-month-outline' : 'clock-outline'} size={20} color={theme.colors.onSurface} />
        </Pressable>
        {open && Platform.OS === 'android' ? (
          <NativePicker
            value={toPickerDate(mode, value)}
            mode={mode}
            is24Hour={false}
            minimumDate={mode === 'date' ? toPickerDate('date', min) : undefined}
            onChange={onNativeChange}
          />
        ) : null}
        {Platform.OS === 'ios' ? (
          <Portal>
            <Dialog visible={open} onDismiss={() => setOpen(false)}>
              <Dialog.Title>{label}</Dialog.Title>
              <Dialog.Content>
                <NativePicker
                  value={toPickerDate(mode, draft || value)}
                  mode={mode}
                  display="spinner"
                  minimumDate={mode === 'date' ? toPickerDate('date', min) : undefined}
                  onChange={onNativeChange}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setOpen(false)}>Cancel</Button>
                <Button
                  onPress={() => {
                    onChange(draft || value || fromPickerDate(mode, toPickerDate(mode, null)));
                    setOpen(false);
                  }}
                >
                  Done
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}:</Text>
      {field}
      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 2 },
  label: { marginBottom: 4, fontSize: 15 },
  box: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontSize: 16 },
  spacer: { height: 8 },
});
