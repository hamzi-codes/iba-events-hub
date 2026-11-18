import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';

// A confirmation sheet, optionally asking for a reason (screen 15, Cancel event).
//   reasonLabel  : shows a reason box when set, for example "Reason (required)"
//   minLength    : the reason must have at least this many characters (0 = optional)
// onConfirm(reason) is called only when the reason is long enough. The caller shows server
// errors by passing `error`, and `busy` while the request runs.
export default function ConfirmDialog({
  visible,
  title,
  message,
  reasonLabel,
  reasonPlaceholder,
  minLength = 0,
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep it',
  busy,
  error,
  onConfirm,
  onDismiss,
}) {
  const [reason, setReason] = useState('');
  const [tooShort, setTooShort] = useState(false);

  useEffect(() => {
    if (visible) {
      setReason('');
      setTooShort(false);
    }
  }, [visible]);

  const submit = () => {
    const text = reason.trim();
    if (reasonLabel && text.length < minLength) {
      setTooShort(true);
      return;
    }
    onConfirm(text);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={busy ? undefined : onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {reasonLabel ? (
            <>
              <Text style={styles.label}>{reasonLabel}</Text>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={3}
                value={reason}
                placeholder={reasonPlaceholder}
                placeholderTextColor="#8A919C"
                onChangeText={(text) => {
                  setReason(text);
                  setTooShort(false);
                }}
                error={tooShort}
                accessibilityLabel="Reason"
                testID="confirm-reason"
              />
              {tooShort ? (
                <HelperText type="error" visible testID="confirm-reason-error">
                  Enter a reason of at least {minLength} characters. Students will see that the event was cancelled.
                </HelperText>
              ) : null}
            </>
          ) : null}
          {error ? (
            <HelperText type="error" visible testID="confirm-error">
              {error}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={busy} testID="confirm-dismiss">
            {cancelLabel}
          </Button>
          <Button onPress={submit} loading={busy} disabled={busy} testID="confirm-ok">
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  message: { marginBottom: 12 },
  label: { marginBottom: 6 },
});
