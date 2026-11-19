const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const c = require('../controllers/approvalsController');

// Mounted at /api/v1/approvals. Approvers only (Section 6.5).
// The organisation check happens inside the controller (NFR-SEC-03).
const router = express.Router();
router.use(requireAuth, requireRole('approver'));

router.get('/pending', c.getPending);
router.get('/decided', c.getDecided);
router.post('/:eventId/approve', c.approve);
router.post('/:eventId/reject', c.reject);
router.post('/:eventId/request-changes', c.requestChanges);

module.exports = router;
