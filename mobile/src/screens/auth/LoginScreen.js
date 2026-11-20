import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import AuthLayout from '../../components/AuthLayout';
import ErrorBanner from '../../components/ErrorBanner';
import FormField from '../../components/FormField';
import LogoPlaceholder from '../../components/LogoPlaceholder';
import { useAuth } from '../../context/AuthContext';
import { validateLogin } from '../../utils/validators';

// Screen 1: Login (FR-AUT-03, 04). POST /auth/login via AuthContext.login().
// One generic message for wrong email or wrong password. Locked and deactivated accounts
// get their own message. An unverified account is sent to the Verify screen.
// "Forgot password" is Sprint 2, so it is not shown.

const MESSAGES = {
  INVALID_CREDENTIALS: 'The email or password is incorrect. Check both and try again.',
  ACCOUNT_LOCKED: 'Too many wrong attempts. This account is locked for 15 minutes. Try again later.',
  ACCOUNT_DEACTIVATED: 'This account is not active. Contact your system administrator.',
};

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const passwordRef = useRef(null);
  const [email, setEmail] = useState(route?.params?.email || '');
  const verified = !!route?.params?.verified;
  const created = !!route?.params?.created;
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (submitting) return;
    const found = validateLogin({ email, password });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    const cleanEmail = email.trim().toLowerCase();
    setSubmitting(true);
    try {
      await login({ email: cleanEmail, password });
      // On success AuthContext sets the user and the root navigator shows the role's tabs.
    } catch (error) {
      setSubmitting(false);
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        navigation.navigate('VerifyEmail', { email: cleanEmail });
        return;
      }
      // What the user typed stays in the fields (NFR-REL-03).
      setFormError(MESSAGES[error.code] || error.message);
    }
  }

  return (
    <AuthLayout>
      <Text variant="titleLarge" style={styles.brand}>
        IBA EVENTS HUB
      </Text>
      <LogoPlaceholder />
      <View style={styles.form} />
      <ErrorBanner
        tone="info"
        message={
          formError
            ? null
            : verified
              ? 'Your email is verified. Log in to continue.'
              : created
                ? 'Your account is ready. Log in to continue.'
                : null
        }        
        testID="login-verified"
      />
      <ErrorBanner message={formError} testID="login-error" />
      <FormField
        label="Email"
        placeholder="name@iba.edu.pk"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        testID="login-email"
      />
      <FormField
        ref={passwordRef}
        label="Password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        testID="login-password"
      />
      <View style={styles.actions}>
        <Button mode="contained" onPress={handleLogin} loading={submitting} disabled={submitting} testID="login-submit">
          Log in
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.navigate('SignUp')}
          disabled={submitting}
          style={styles.link}
          testID="login-to-signup"
        >
          Create an account
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  brand: { textAlign: 'center', fontWeight: '700', marginBottom: 16 },
  form: { height: 16 },
  actions: { marginTop: 8 },
  link: { marginTop: 8 },
});
