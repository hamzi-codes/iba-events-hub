const express = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/browseController');

// Mounted at /api/v1 in app.js. Any logged-in user may browse (Section 6.3).
// requireAuth is added per route (not router.use) so it does not catch
// requests meant for the other routers mounted at /api/v1.
const router = express.Router();

router.get('/categories', requireAuth, c.getCategories);
router.get('/organisations', requireAuth, c.listOrganisations);
router.get('/organisations/:id', requireAuth, c.getOrganisation);
router.get('/organisations/:id/events', requireAuth, c.listOrganisationEvents);
router.get('/events/:id', requireAuth, c.getEvent);
router.get('/venues', requireAuth, c.listVenues);
router.get('/settings/event-types', requireAuth, c.getEventTypes);

module.exports = router;
