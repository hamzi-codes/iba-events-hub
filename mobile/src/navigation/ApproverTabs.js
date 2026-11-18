import { placeholder } from '../components/PlaceholderScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createRoleTabs from './createRoleTabs';

// Approver: Queue, Decided, Profile
export default createRoleTabs([
  { name: 'Queue', label: 'Queue', icon: 'inbox-arrow-down-outline', component: placeholder('Pending queue', 16) },
  { name: 'Decided', label: 'Decided', icon: 'check-decagram-outline', component: placeholder('Decided events', 19) },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
