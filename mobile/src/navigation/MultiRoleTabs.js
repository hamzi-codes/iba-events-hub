import BrowseStack from './BrowseStack';
import SubmissionsStack from './SubmissionsStack';
import ProfileScreen from '../screens/shared/ProfileScreen';
import createApproverStack from './ApproverStack';
import createRoleTabs from './createRoleTabs';

// User who is both organiser and approver (Section 7.2, test with dual.test@iba.edu.pk):
// Browse, Submissions, Queue, Profile. "Decided events" is a link at the bottom of the Queue screen.
export default createRoleTabs([
  { name: 'Browse', label: 'Browse', icon: 'compass-outline', component: BrowseStack },
  { name: 'Submissions', label: 'Submissions', icon: 'file-document-edit-outline', component: SubmissionsStack },
  { name: 'Queue', label: 'Queue', icon: 'inbox-arrow-down-outline', component: createApproverStack('PendingQueue', { showDecidedLink: true }) },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: ProfileScreen },
]);
