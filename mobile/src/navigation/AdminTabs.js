import ProfileScreen from '../screens/shared/ProfileScreen';
import { AdminEventsStack, AdminMenuStack } from './AdminStacks';
import createRoleTabs from './createRoleTabs';

// Admin: Admin, Events, Profile
export default createRoleTabs([
  { name: 'Admin', label: 'Admin', icon: 'shield-account-outline', component: AdminMenuStack },
  { name: 'Events', label: 'Events', icon: 'calendar-month-outline', component: AdminEventsStack },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
