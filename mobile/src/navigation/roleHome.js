// Decides which tab set a user sees after login (Master Document 7.2).
// Every user also has the "student" role, so it is checked last.
export function getHomeRoute(user) {
  const roles = user?.roles || [];
  if (roles.includes('admin')) return 'AdminTabs';
  const organiser = roles.includes('organiser');
  const approver = roles.includes('approver');
  if (organiser && approver) return 'MultiRoleTabs';
  if (organiser) return 'OrganiserTabs';
  if (approver) return 'ApproverTabs';
  return 'StudentTabs';
}
