import { placeholder } from '../components/PlaceholderScreen';
import BrowseStack from './BrowseStack';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createRoleTabs from './createRoleTabs';

// Organiser: Browse, Submissions, Profile
export default createRoleTabs([
  { name: 'Browse', label: 'Browse', icon: 'compass-outline', component: BrowseStack },
  { name: 'Submissions', label: 'Submissions', icon: 'file-document-edit-outline', component: placeholder('My submissions', 9) },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
