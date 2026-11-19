import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Dialog, HelperText, Portal, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// A box that opens a list of choices. Label above, error text below (same look as FormField).
// options: [{ value, label }]. onChange(value, option).
export default function DropdownField({ label, value, options, onChange, placeholder, error, disabled, testID }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}:</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selected ? selected.label : 'Not chosen'}`}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          styles.box,
          { borderColor: error ? theme.colors.error : theme.colors.outline, backgroundColor: disabled ? '#ECEEF1' : theme.colors.surface },
        ]}
        testID={testID}
      >
        <Text style={[styles.value, !selected && { color: '#8A919C' }]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={22} color={theme.colors.onSurface} />
      </Pressable>
      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : (
        <View style={styles.spacer} />
      )}

      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView>
              {options.length === 0 ? <Text style={styles.none}>Nothing to choose from yet.</Text> : null}
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setOpen(false);
                    onChange(option.value, option);
                  }}
                  accessibilityRole="button"
                  style={styles.option}
                  testID={`${testID}-option-${option.value}`}
                >
                  <Text style={option.value === value ? styles.optionSelected : undefined}>{option.label}</Text>
                  {option.value === value ? <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
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
  value: { flex: 1, fontSize: 16, marginRight: 8 },
  spacer: { height: 8 },
  scrollArea: { maxHeight: 320, paddingHorizontal: 0 },
  option: { paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionSelected: { fontWeight: '700' },
  none: { padding: 24 },
});
