const mongoose = require('mongoose');

const ROLES = ['student', 'organiser', 'approver', 'admin'];
const AFFILIATION_TYPES = ['organiser', 'approver'];

const affiliationSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    type: { type: String, enum: AFFILIATION_TYPES, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [{ type: String, enum: ROLES }], default: ['student'] },
    affiliations: { type: [affiliationSchema], default: [] },
    isVerified: { type: Boolean, default: false },
    verifyCodeHash: { type: String, default: null },
    verifyCodeExpiresAt: { type: Date, default: null },
    verifyResendCount: { type: Number, default: 0 },
    verifyResendWindowStart: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// Never let secrets leave the server, even by accident.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.verifyCodeHash;
    delete ret.verifyCodeExpiresAt;
    delete ret.verifyResendCount;
    delete ret.verifyResendWindowStart;
    delete ret.failedLoginCount;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
module.exports.AFFILIATION_TYPES = AFFILIATION_TYPES;