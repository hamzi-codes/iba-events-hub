import React from 'react';
import { Button, Text } from 'react-native-paper';

import AuthLayout from '../../components/AuthLayout';

// Screen 3: Verify your email (FR-AUT-02). PLACEHOLDER: the real screen (6-digit code box,
// Verify, Resend, "valid for 24 hours") is the next screen in the build order.
// Login (unverified account) and Sign up (success) both land here with { email }.
export default function VerifyEmailScreen({ navigation, route }) {
  const email = route.params?.email;
  return (
    <AuthLayout headerTitle="Verify your email" onBack={() => navigation.goBack()}>
      <Text>{email ? `We sent a code to ${email}.` : ''}</Text>
      <Text style={{ marginTop: 12 }}>Not built yet (Section 7.3, screen 3).</Text>
      <Button mode="outlined" onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
        Back to log in
      </Button>
    </AuthLayout>
  );
}
