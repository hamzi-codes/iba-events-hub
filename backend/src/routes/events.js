const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { STATUSES } = require('../models/Event');
const controller = require('../controllers/events');

const router = express.Router();
const organiser = [requireAuth, requireRole('organiser')];

const isText = (v) => typeof v === 'string';

// Type checks only (NFR-SEC-07: reject objects where text is expected).
// The business rules and field messages live in services/eventRules.js.
const eventRules = [
  body([
    'organisationId', 'title', 'description', 'eventType', 'startAt', 'endAt', 'venueId',
    'speakerName', 'speakerDesignation', 'presenterName', 'thesisTitle', 'supervisorName',
  ])
    .optional({ nullable: true })
    .custom(isText).withMessage('This must be plain text.'),
  body(['isOnline', 'registrationRequired', 'attendanceEnabled'])
    .optional({ nullable: true })
    .custom((v) => typeof v === 'boolean').withMessage('Choose yes or no.'),
  body('capacity')
    .optional({ nullable: true })
    .custom((v) => typeof v === 'number' || typeof v === 'string').withMessage('Capacity must be a number.'),
];

const conflictRules = [
  query('venueId')
    .custom(isText).withMessage('Choose a venue.').bail()
    .isMongoId().withMessage('Choose a valid venue.'),
  query('startAt')
    .custom(isText).withMessage('Choose a start time.').bail()
    .isISO8601().withMessage('The start time is not valid.'),
  query('endAt')
    .custom(isText).withMessage('Choose an end time.').bail()
    .isISO8601().withMessage('The end time is not valid.').bail()
    .custom((value, { req }) => new Date(value) > new Date(req.query.startAt))
    .withMessage('End time must be after the start time.'),
  query('excludeEventId')
    .optional()
    .custom(isText).withMessage('This must be plain text.').bail()
    .isMongoId().withMessage('This is not a valid event id.'),
];

const statusRule = [
  query('status')
    .optional()
    .custom(isText).withMessage('Choose a valid status.').bail()
    .isIn(STATUSES).withMessage('Choose a valid status.'),
];

const cancelRules = [
  body('reason')
    .optional({ nullable: true })
    .custom(isText).withMessage('The reason must be plain text.').bail()
    .isLength({ max: 500 }).withMessage('The reason can be at most 500 characters.'),
];

router.get('/events/conflict-check', ...organiser, conflictRules, validate, controller.conflictCheck);
router.post('/events', ...organiser, eventRules, validate, controller.createEvent);
router.get('/my/events', ...organiser, statusRule, validate, controller.myEvents);
router.put('/events/:id', ...organiser, eventRules, validate, controller.updateEvent);
router.post('/events/:id/resubmit', ...organiser, controller.resubmitEvent);
router.post('/events/:id/cancel', ...organiser, cancelRules, validate, controller.cancelEvent);

module.exports = router;