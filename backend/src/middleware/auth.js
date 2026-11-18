const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const { ApiError } = require('./errorHandler');

function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    } catch (e) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again.');
    }

    if (!mongoose.isValidObjectId(payload.sub)) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Your session is not valid. Please log in again.');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Your session is not valid. Please log in again.');
    }
    if (!user.isActive) {
      throw new ApiError(
        403,
        'ACCOUNT_DEACTIVATED',
        'This account has been deactivated. Please contact the administrator.'
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, signToken };