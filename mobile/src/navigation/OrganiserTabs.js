import BrowseStack from './BrowseStack';
import SubmissionsStack from './SubmissionsStack';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createRoleTabs from './createRoleTabs';

// Organiser: Browse, Submissions, Profile
export default createRoleTabs([
  { name: 'Browse', label: 'Browse', icon: 'compass-outline', component: BrowseStack },
  { name: 'Submissions', label: 'Submissions', icon: 'file-document-edit-outline', component: SubmissionsStack },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
