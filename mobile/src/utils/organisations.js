import { getOrganisation } from '../api/browse';

// The organisations this user can create events for (affiliations of type "organiser").
// The user object should carry organisationName and category (Section 6.1). If the server
// leaves them out, they are looked up with GET /organisations/:id so the form still works.
export async function resolveOrganiserOrganisations(user) {
  const links = (user?.affiliations || []).filter((a) => a.type === 'organiser');
  const seen = new Set();
  const unique = links.filter((a) => (seen.has(a.organisationId) ? false : seen.add(a.organisationId)));
  return Promise.all(
    unique.map(async (link) => {
      if (link.organisationName && link.category) {
        return { id: link.organisationId, name: link.organisationName, category: link.category };
      }
      const organisation = await getOrganisation(link.organisationId);
      return { id: organisation.id, name: organisation.name, category: organisation.category };
    })
  );
}
