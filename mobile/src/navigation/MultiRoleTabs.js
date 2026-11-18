import { placeholder } from '../components/PlaceholderScreen';
import createRoleTabs from './createRoleTabs';

// User who is both organiser and approver (Section 7.2, test with dual.test@iba.edu.pk):
// Browse, Submissions, Queue, Profile. "Decided" becomes a switch inside Queue later.
export default createRoleTabs([
  { name: 'Browse', label: 'Browse', icon: 'compass-outline', component: placeholder('Browse (Home)', 5) },
  { name: 'Submissions', label: 'Submissions', icon: 'file-document-edit-outline', component: placeholder('My submissions', 9) },
  { name: 'Queue', label: 'Queue', icon: 'inbox-arrow-down-outline', component: placeholder('Pending queue', 16) },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline', component: placeholder('Profile', 4) },
]);
