import { placeholder } from '../components/PlaceholderScreen';
import BrowseStack from './BrowseStack';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createRoleTabs from './createRoleTabs';

// Student: Home, Profile
export default createRoleTabs([
  { name: 'Home', label: 'Home', icon: 'home-variant-outline', component: BrowseStack },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
