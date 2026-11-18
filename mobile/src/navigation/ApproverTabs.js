import ProfileScreen from '../screens/shared/ProfileScreen';
import createApproverStack from './ApproverStack';
import createRoleTabs from './createRoleTabs';

// Approver: Queue, Decided, Profile
export default createRoleTabs([
  { name: 'Queue', label: 'Queue', icon: 'inbox-arrow-down-outline', component: createApproverStack('PendingQueue') },
  { name: 'Decided', label: 'Decided', icon: 'check-decagram-outline', component: createApproverStack('DecidedHome') },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
