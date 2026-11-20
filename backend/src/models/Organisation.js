const mongoose = require('mongoose');

const CATEGORIES = ['society', 'school', 'department'];

const organisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique on category plus name
organisationSchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Organisation', organisationSchema);
module.exports.CATEGORIES = CATEGORIES;