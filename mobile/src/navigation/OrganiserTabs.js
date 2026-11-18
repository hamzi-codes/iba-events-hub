import { placeholder } from '../components/PlaceholderScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createRoleTabs from './createRoleTabs';

// Organiser: Browse, Submissions, Profile
export default createRoleTabs([
  { name: 'Browse', label: 'Browse', icon: 'compass-outline', component: placeholder('Browse (Home)', 5) },
  { name: 'Submissions', label: 'Submissions', icon: 'file-document-edit-outline', component: placeholder('My submissions', 9) },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
