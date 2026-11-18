const mongoose = require('mongoose');

const STATUSES = ['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'];

const eventSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    eventType: { type: String, required: true, trim: true },
    startAt: { type: Date, required: true }, // UTC
    endAt: { type: Date, required: true }, // UTC
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null }, // empty when online
    isOnline: { type: Boolean, default: false },
    capacity: { type: Number, min: 1, default: null },
    registrationRequired: { type: Boolean, default: false },
    attendanceEnabled: { type: Boolean, default: false }, // used in Sprint 2
    speakerName: { type: String, trim: true, default: '' },
    speakerDesignation: { type: String, trim: true, default: '' },
    presenterName: { type: String, trim: true, default: '' },
    thesisTitle: { type: String, trim: true, default: '' },
    supervisorName: { type: String, trim: true, default: '' },
    status: { type: String, enum: STATUSES, default: 'PENDING' },
    cancelledAfterApproval: { type: Boolean, default: false },
    cancellationReason: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

eventSchema.index({ venueId: 1, startAt: 1, endAt: 1 });
eventSchema.index({ organisationId: 1, status: 1 });
eventSchema.index({ status: 1, startAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.STATUSES = STATUSES;