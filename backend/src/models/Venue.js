const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  location: { type: String, trim: true, default: '' },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Capacity must be a whole number.',
    },
  },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Venue', venueSchema);