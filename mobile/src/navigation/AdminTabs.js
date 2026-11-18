import { placeholder } from '../components/PlaceholderScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createRoleTabs from './createRoleTabs';

// Admin: Admin, Events, Profile
export default createRoleTabs([
  { name: 'Admin', label: 'Admin', icon: 'shield-account-outline', component: placeholder('Admin menu', 20) },
  { name: 'Events', label: 'Events', icon: 'calendar-month-outline', component: placeholder('All events (read-only)', 26) },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
