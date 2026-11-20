const { ApiError } = require('./errorHandler');

// Use after requireAuth. Example: router.use(requireAuth, requireRole('admin'))
function requireRole(...allowed) {
  return (req, res, next) => {
    const roles = (req.user && req.user.roles) || [];
    if (!allowed.some((role) => roles.includes(role))) {
      return next(
        new ApiError(403, 'FORBIDDEN', 'You do not have permission to do that.')
      );
    }
    return next();
  };
}

// For the organisation check inside controllers (NFR-SEC-03).
// type is 'organiser' or 'approver'.
function hasAffiliation(user, organisationId, type) {
  return user.affiliations.some(
    (a) => String(a.organisationId) === String(organisationId) && a.type === type
  );
}

// IDs of all organisations the user is linked to with this type.
function affiliatedOrgIds(user, type) {
  return user.affiliations.filter((a) => a.type === type).map((a) => a.organisationId);
}

module.exports = { requireRole, hasAffiliation, affiliatedOrgIds };