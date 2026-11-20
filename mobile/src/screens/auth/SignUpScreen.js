import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { signup } from '../../api/auth';
import AuthLayout from '../../components/AuthLayout';
import ErrorBanner from '../../components/ErrorBanner';
import FormField from '../../components/FormField';
import { validateSignUp } from '../../utils/validators';

// Screen 2: Create account (FR-AUT-01). POST /auth/signup.
// Sign-up always makes a student; the app never sends a role.
// On success go to Verify email. Server field errors show next to each field.

const PASSWORD_HINT = 'At least 1 letter and 1 digit. Minimum 8 characters';
const FIELD_KEYS = ['fullName', 'email', 'password', 'confirmPassword'];

export default function SignUpScreen({ navigation }) {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSignUp() {
    if (submitting) return;
    const found = validateSignUp(form);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    };
    setSubmitting(true);
    try {
      const result = await signup(payload);
      setSubmitting(false);
      if (result && result.verificationRequired === false) {
        navigation.navigate('Login', { email: payload.email, created: true });
      } else {
        navigation.navigate('VerifyEmail', { email: payload.email });
      }
    } catch (error) {
      setSubmitting(false);
      // Everything typed stays in the fields (NFR-REL-03).
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ email: error.message });
      } else if (error.fields) {
        const mapped = {};
        FIELD_KEYS.forEach((key) => {
          if (error.fields[key]) mapped[key] = error.fields[key];
        });
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) setFormError(error.message);
      } else {
        setFormError(error.message);
      }
    }
  }

  return (
    <AuthLayout headerTitle="Create account" onBack={() => navigation.goBack()}>
      <ErrorBanner message={formError} testID="signup-error" />
      <FormField
        label="Full name"
        placeholder="Firstname Lastname"
        value={form.fullName}
        onChangeText={setField('fullName')}
        error={errors.fullName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        testID="signup-name"
      />
      <FormField
        ref={emailRef}
        label="Email"
        placeholder="name@iba.edu.pk"
        value={form.email}
        onChangeText={setField('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        testID="signup-email"
      />
      <FormField
        ref={passwordRef}
        label="Password"
        placeholder="Password"
        value={form.password}
        onChangeText={setField('password')}
        error={errors.password}
        hint={PASSWORD_HINT}
        secureTextEntry
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        testID="signup-password"
      />
      <FormField
        ref={confirmRef}
        label="Confirm Password"
        placeholder="Password"
        value={form.confirmPassword}
        onChangeText={setField('confirmPassword')}
        error={errors.confirmPassword}
        secureTextEntry
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
        testID="signup-confirm"
      />
      <Text style={styles.note}>Account will start with a student role</Text>
      <View style={styles.actions}>
        <Button mode="contained" onPress={handleSignUp} loading={submitting} disabled={submitting} testID="signup-submit">
          Sign up
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.popTo('Login')}
          disabled={submitting}
          style={styles.link}
          testID="signup-to-login"
        >
          Log in
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 4, textAlign: 'center', fontStyle: 'italic' },
  actions: { marginTop: 16 },
  link: { marginTop: 8 },
});
