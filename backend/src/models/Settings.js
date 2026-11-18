const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  allowedEmailDomains: { type: [String], default: [] },
  eventTypes: {
    society: { type: [String], default: [] },
    school: { type: [String], default: [] },
    department: { type: [String], default: [] },
  },
});

module.exports = mongoose.model('Settings', settingsSchema);