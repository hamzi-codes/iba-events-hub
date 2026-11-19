import React from 'react';
import { View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import EmptyState from './EmptyState';

// Shows its children only to users who have one of the roles. Anyone else sees a plain
// message. The server still refuses them (403), this only avoids a confusing screen (NFR-SEC).
export default function RoleGate({ roles, children }) {
  const { user } = useAuth();
  const allowed = user && roles.some((role) => user.roles.includes(role));
  if (allowed) return children;
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <EmptyState icon="lock-outline" message="You do not have permission to see this screen." testID="role-gate-denied" />
    </View>
  );
}
