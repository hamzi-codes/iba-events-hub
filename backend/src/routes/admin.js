const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const validate = require('../middleware/validate');
const c = require('../controllers/adminController');
const { ROLES, AFFILIATION_TYPES } = require('../models/User');
const { CATEGORIES } = require('../models/Organisation');

// Mounted at /api/v1/admin. System administrators only (Section 6.6).
const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// ----- reusable validation rules (NFR-SEC-07: reject objects where text is expected) -----
const text = (field, { min = 0, max, required = true, label }) => {
  let rule = body(field);
  if (!required) rule = rule.optional({ values: 'undefined' });
  return rule
    .isString().withMessage('Enter text.').bail()
    .trim()
    .isLength({ min, max }).withMessage(min > 0 ? `${label} must be ${min} to ${max} characters.` : `Use at most ${max} characters.`);
};
const strictBoolean = body('isActive').custom((v) => typeof v === 'boolean').withMessage('Send true or false.');
const idList = (field, { min = 0, optional = false }) => {
  let rule = body(field);
  if (optional) rule = rule.optional({ values: 'undefined' });
  return rule.isArray({ min }).withMessage(min > 0 ? 'Choose at least one account.' : 'Send a list of account ids.').bail()
    .custom((list) => list.every((id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id))).withMessage('Every id must be a valid account id.');
};
const capacity = body('capacity').custom((v) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 100000;
}).withMessage('Enter a whole number of at least 1.');

// ----- users -----
router.get('/users', c.listUsers);
router.get('/users/:id', c.getUser);
router.put('/users/:id/access', [
  body('roles').isArray().withMessage('Send a list of roles.').bail()
    .custom((roles) => roles.every((r) => ROLES.includes(r))).withMessage(`Roles must be from: ${ROLES.join(', ')}.`),
  body('affiliations').isArray().withMessage('Send a list of organisation links.').bail()
    .custom((list) => list.every((a) => a && typeof a === 'object' && typeof a.organisationId === 'string' && /^[0-9a-fA-F]{24}$/.test(a.organisationId) && AFFILIATION_TYPES.includes(a.type)))
    .withMessage('Each link needs an organisationId and a type of organiser or approver.'),
], validate, c.updateAccess);
router.patch('/users/:id/status', [strictBoolean], validate, c.setUserStatus);

// ----- organisations -----
router.get('/organisations', c.listOrganisations);
router.post('/organisations', [
  body('category').isIn(CATEGORIES).withMessage('Choose society, school or department.'),
  text('name', { min: 2, max: 100, label: 'The name' }),
  text('description', { max: 500, required: false }),
  idList('approverUserIds', { min: 1 }),
  idList('organiserUserIds', { optional: true }),
], validate, c.createOrganisation);
router.put('/organisations/:id', [
  text('name', { min: 2, max: 100, required: false, label: 'The name' }),
  text('description', { max: 500, required: false }),
  idList('approverUserIds', { min: 1, optional: true }),
  idList('organiserUserIds', { optional: true }),
], validate, c.updateOrganisation);
router.patch('/organisations/:id/status', [strictBoolean], validate, c.setOrganisationStatus);

// ----- venues -----
router.get('/venues', c.listVenues);
router.post('/venues', [text('name', { min: 2, max: 100, label: 'The name' }), text('location', { max: 100, required: false }), capacity], validate, c.createVenue);
router.put('/venues/:id', [text('name', { min: 2, max: 100, label: 'The name' }), text('location', { max: 100, required: false }), capacity], validate, c.updateVenue);
router.patch('/venues/:id/status', [strictBoolean], validate, c.setVenueStatus);

// ----- all events (read only) and settings -----
router.get('/events', c.listEvents);
router.get('/settings', c.getSettings);
router.put('/settings', c.updateSettings);

module.exports = router;
