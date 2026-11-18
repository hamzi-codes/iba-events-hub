import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { resendCode, verifyEmail } from '../../api/auth';
import AuthLayout from '../../components/AuthLayout';
import ErrorBanner from '../../components/ErrorBanner';
import FormField from '../../components/FormField';
import LogoPlaceholder from '../../components/LogoPlaceholder';
import { validateCode } from '../../utils/validators';

// Screen 3: Verify your email (FR-AUT-02). POST /auth/verify-email and /auth/resend-code.
// Both Create account (success) and Login (unverified account) land here with { email }.
// Sprint 1 uses a 6-digit code only, no link (Master Document 3.5, decision D6).
// On success the user goes to Login with a "verified" note, because the app does not
// hold the password and a token only comes from POST /auth/login.
export default function VerifyEmailScreen({ navigation, route }) {
  const theme = useTheme();
  const email = route.params?.email;
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const onChangeCode = (value) => setCode(value.replace(/\D/g, '').slice(0, 6));

  async function handleVerify() {
    if (verifying || resending) return;
    setNotice(null);
    setFormError(null);
    const problem = validateCode(code);
    setCodeError(problem);
    if (problem) return;

    setVerifying(true);
    try {
      await verifyEmail({ email, code });
      setVerifying(false);
      navigation.popTo('Login', { verified: true, email });
    } catch (error) {
      setVerifying(false);
      // The typed code stays in the box (NFR-REL-03).
      if (error.code === 'INVALID_CODE') setCodeError(error.message);
      else setFormError(error.message); // CODE_EXPIRED says to tap Resend; network errors land here too
    }
  }

  async function handleResend() {
    if (verifying || resending) return;
    setNotice(null);
    setFormError(null);
    setCodeError(null);
    setResending(true);
    try {
      await resendCode({ email });
      setNotice(`We sent a new code to ${email}. It is valid for 24 hours.`);
    } catch (error) {
      setFormError(error.message); // TOO_MANY_REQUESTS after 5 in an hour (FR-AUT-02)
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <AuthLayout headerTitle="Verify your email" onBack={() => navigation.popTo('Login')}>
        <ErrorBanner message="We lost track of which email to verify. Go back to log in and try again." />
        <Button mode="contained" onPress={() => navigation.popTo('Login')}>
          Back to log in
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout headerTitle="Verify your email" onBack={() => navigation.goBack()}>
      <LogoPlaceholder label="Envelope" height={90} />
      <Text style={styles.sent}>We sent a code to {email}</Text>

      <ErrorBanner tone="info" message={notice} testID="verify-notice" />
      <ErrorBanner message={formError} testID="verify-error" />

      <FormField
        label="Enter Code"
        placeholder="6-digit code"
        value={code}
        onChangeText={onChangeCode}
        error={codeError}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="done"
        onSubmitEditing={handleVerify}
        testID="verify-code"
      />
      <Button mode="contained" onPress={handleVerify} loading={verifying} disabled={verifying || resending} testID="verify-submit">
        Verify
      </Button>
      <Button
        mode="text"
        onPress={handleResend}
        loading={resending}
        disabled={verifying || resending}
        style={styles.resend}
        labelStyle={styles.underline}
        testID="verify-resend"
      >
        Resend code
      </Button>

      <View style={[styles.warning, { borderColor: theme.colors.outline }]}>
        <MaterialCommunityIcons name="alert" size={20} color={theme.colors.onSurface} />
        <Text style={styles.warningText}>Didn't receive anything? Resend the code to try again</Text>
      </View>
      <Text style={styles.valid}>Code valid for 24 hours</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  sent: { textAlign: 'center', marginTop: 12, marginBottom: 16 },
  resend: { marginTop: 4 },
  underline: { textDecorationLine: 'underline' },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginTop: 16,
  },
  warningText: { flex: 1, marginLeft: 10, fontStyle: 'italic' },
  valid: { textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
