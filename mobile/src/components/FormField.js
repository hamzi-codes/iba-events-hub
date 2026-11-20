import React, { forwardRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, Text, TextInput } from 'react-native-paper';

// Wireframe field: label ABOVE the box, placeholder inside, error text right under it
// (FR-SUB-05: field errors next to the field). "hint" shows when there is no error,
// e.g. the password rule on Create account.
const FormField = forwardRef(function FormField(
  { label, value, onChangeText, error, hint, secureTextEntry, testID, placeholder, ...rest },
  ref
) {
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}:</Text>
      <TextInput
        ref={ref}
        mode="outlined"
        dense
        placeholder={placeholder}
        placeholderTextColor="#8A919C"
        value={value}
        onChangeText={onChangeText}
        error={!!error}
        secureTextEntry={isPassword && hidden}
        accessibilityLabel={label}
        right={
          isPassword ? (
            <TextInput.Icon
              icon={hidden ? 'eye-outline' : 'eye-off-outline'}
              onPress={() => setHidden((h) => !h)}
              forceTextInputFocus={false}
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            />
          ) : undefined
        }
        testID={testID}
        {...rest}
      />
      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : hint ? (
        <HelperText type="info" visible>
          {hint}
        </HelperText>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: 2 },
  label: { marginBottom: 4, fontSize: 15 },
  spacer: { height: 8 },
});

export default FormField;
