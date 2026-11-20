const mongoose = require('mongoose');
const { STATUSES } = require('./Event');

const eventHistorySchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    fromStatus: { type: String, enum: [...STATUSES, null], default: null }, // empty for the first entry
    toStatus: { type: String, enum: STATUSES, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    comment: { type: String, trim: true, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// History can only be added to. Nobody edits or deletes it, including admin.
const blocked = () => {
  throw new Error('Event history is append only and cannot be changed or deleted.');
};
const queryOps = [
  'updateOne',
  'updateMany',
  'replaceOne',
  'findOneAndUpdate',
  'findOneAndReplace',
  'findOneAndDelete',
  'deleteOne',
  'deleteMany',
];
eventHistorySchema.pre(queryOps, { query: true, document: false }, blocked);
eventHistorySchema.pre('deleteOne', { document: true, query: false }, blocked);
eventHistorySchema.pre('save', function () {
  if (!this.isNew) blocked();
});

module.exports = mongoose.model('EventHistory', eventHistorySchema);