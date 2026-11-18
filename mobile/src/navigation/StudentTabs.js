import { placeholder } from '../components/PlaceholderScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createRoleTabs from './createRoleTabs';

// Student: Home, Profile
export default createRoleTabs([
  { name: 'Home', label: 'Home', icon: 'home-variant-outline', component: placeholder('Home', 5) },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
