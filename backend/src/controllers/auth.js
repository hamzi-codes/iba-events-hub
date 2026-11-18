const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const User = require('../models/User');
require('../models/Organisation');
const Setting = require('../models/Setting');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { signToken } = require('../middleware/auth');
const { sendVerificationCode } = require('../services/email');

const DEFAULT_DOMAINS = ['iba.edu.pk', 'khi.iba.edu.pk']; // decision D10
const CODE_VALID_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RESENDS = 5; // per hour
const HOUR_MS = 60 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

// ---------- helpers ----------

// The User object from Section 6.1. Other controllers can reuse this.
async function userResponse(user) {
  await user.populate('affiliations.organisationId', 'name category');
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    roles: user.roles,
    affiliations: user.affiliations
      .filter((a) => a.organisationId)
      .map((a) => ({
        organisationId: a.organisationId.id,
        organisationName: a.organisationId.name,
        category: a.organisationId.category,
        type: a.type,
      })),
  };
}

async function newCode() {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  return {
    code,
    hash: await bcrypt.hash(code, 10),
    expiresAt: new Date(Date.now() + CODE_VALID_MS),
  };
}

async function allowedDomains() {
  const setting = await Setting.findOne();
  return setting && setting.allowedEmailDomains.length
    ? setting.allowedEmailDomains.map((d) => d.toLowerCase())
    : DEFAULT_DOMAINS;
}

function lockedError(lockUntil) {
  const minutes = Math.max(1, Math.ceil((lockUntil - Date.now()) / 60000));
  return new ApiError(
    429,
    'ACCOUNT_LOCKED',
    `Too many wrong passwords. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
  );
}

const invalidCode = () =>
  new ApiError(400, 'INVALID_CODE', 'That code is not correct. Check it and try again.');

// ---------- handlers ----------

// POST /auth/signup  (FR-AUT-01)
const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body; // any "roles" sent by the client is ignored

  const domain = email.split('@')[1];
  if (!(await allowedDomains()).includes(domain)) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Some details need fixing. Check the highlighted fields and try again.',
      { email: 'Use your IBA email address, for example name@iba.edu.pk.' }
    );
  }

  if (await User.exists({ email })) {
    throw new ApiError(
      409,
      'EMAIL_TAKEN',
      'An account with this email already exists. Log in instead, or use a different email.'
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationOn = env.requireEmailVerification;
  const code = verificationOn ? await newCode() : null;

  try {
    await User.create({
      fullName,
      email,
      passwordHash,
      roles: ['student'],
      isVerified: !verificationOn,
      verifyCodeHash: code ? code.hash : null,
      verifyCodeExpiresAt: code ? code.expiresAt : null,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(
        409,
        'EMAIL_TAKEN',
        'An account with this email already exists. Log in instead, or use a different email.'
      );
    }
    throw err;
  }

  // Fallback D6: verification switched off, so the account is ready to use
  if (!verificationOn) {
    return res.status(201).json({
      message: 'Account created. You can log in now.',
      verificationRequired: false,
    });
  }

  try {
    await sendVerificationCode(email, code.code);
  } catch (err) {
    console.error('Could not send verification email:', err.message);
    return res.status(201).json({
      message: 'Account created, but we could not send the code. Tap Resend on the next screen.',
      verificationRequired: true,
    });
  }
  return res.status(201).json({
    message: 'Account created. We sent a 6-digit code to your email. Enter it to verify.',
    verificationRequired: true,
  });
});

// POST /auth/verify-email  (FR-AUT-02)
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw invalidCode();

  if (user.isVerified) {
    return res.json({ message: 'Your email is already verified. You can log in.' });
  }
  if (!user.verifyCodeHash || !user.verifyCodeExpiresAt) throw invalidCode();
  if (user.verifyCodeExpiresAt < new Date()) {
    throw new ApiError(400, 'CODE_EXPIRED', 'This code has expired. Tap Resend to get a new one.');
  }
  if (!(await bcrypt.compare(code, user.verifyCodeHash))) throw invalidCode();

  await User.updateOne(
    { _id: user._id },
    {
      isVerified: true,
      verifyCodeHash: null,
      verifyCodeExpiresAt: null,
      verifyResendCount: 0,
      verifyResendWindowStart: null,
    }
  );
  return res.json({ message: 'Email verified. You can log in now.' });
});

// POST /auth/resend-code  (FR-AUT-02)
const resendCode = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericReply = {
    message: 'If this account needs verification, we have sent a new code to the email.',
  };

  const user = await User.findOne({ email });
  if (!user || user.isVerified) return res.json(genericReply);

  const now = Date.now();
  const windowStart = user.verifyResendWindowStart ? user.verifyResendWindowStart.getTime() : 0;
  let count = user.verifyResendCount;
  let start = user.verifyResendWindowStart;
  if (!start || now - windowStart > HOUR_MS) {
    count = 0;
    start = new Date(now);
  }
  if (count >= MAX_RESENDS) {
    throw new ApiError(
      429,
      'TOO_MANY_REQUESTS',
      'You have asked for too many codes. Please wait an hour and try again.'
    );
  }

  const code = await newCode();
  await User.updateOne(
    { _id: user._id },
    {
      verifyCodeHash: code.hash,
      verifyCodeExpiresAt: code.expiresAt,
      verifyResendCount: count + 1,
      verifyResendWindowStart: start,
    }
  );

  try {
    await sendVerificationCode(email, code.code);
  } catch (err) {
    console.error('Could not send verification email:', err.message);
    throw new ApiError(
      500,
      'INTERNAL_ERROR',
      'We could not send the email right now. Please try again in a moment.'
    );
  }
  return res.json(genericReply);
});

// POST /auth/login  (FR-AUT-03, NFR-SEC-04)
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const badCredentials = () =>
    new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is not correct. Check them and try again.');

  const user = await User.findOne({ email });
  if (!user) throw badCredentials();

  // Locked: refuse even the right password until the lock ends
  if (user.lockUntil && user.lockUntil > new Date()) throw lockedError(user.lockUntil);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { failedLoginCount: 1 } },
      { new: true }
    );
    if (updated.failedLoginCount >= MAX_FAILED_LOGINS) {
      const lockUntil = new Date(Date.now() + LOCK_MS);
      await User.updateOne({ _id: user._id }, { failedLoginCount: 0, lockUntil });
      throw lockedError(lockUntil);
    }
    throw badCredentials();
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      'ACCOUNT_DEACTIVATED',
      'This account has been deactivated. Please contact the administrator.'
    );
  }
  if (!user.isVerified) {
    throw new ApiError(
      403,
      'EMAIL_NOT_VERIFIED',
      'Please verify your email first. Enter the 6-digit code we sent you, or ask for a new one.'
    );
  }

  await User.updateOne({ _id: user._id }, { failedLoginCount: 0, lockUntil: null });
  return res.json({ token: signToken(user), user: await userResponse(user) });
});

// GET /auth/me  (FR-AUT-04, 07)
const me = asyncHandler(async (req, res) => {
  res.json({ user: await userResponse(req.user) });
});

// POST /auth/logout  (the app deletes its token)
const logout = (req, res) => {
  res.status(204).send();
};

module.exports = { signup, verifyEmail, resendCode, login, me, logout, userResponse };