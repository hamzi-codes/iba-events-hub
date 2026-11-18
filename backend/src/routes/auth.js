const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/auth');

const router = express.Router();

const emailRule = body('email')
  .isString().withMessage('Enter your email address.').bail()
  .trim().toLowerCase()
  .isEmail().withMessage('Enter a valid email address, like name@iba.edu.pk.');

router.post(
  '/signup',
  [
    body('fullName')
      .isString().withMessage('Enter your full name.').bail()
      .trim()
      .isLength({ min: 2, max: 60 }).withMessage('Your name must be 2 to 60 characters.'),
    emailRule,
    body('password')
      .isString().withMessage('Enter a password.').bail()
      .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters.').bail()
      .matches(/[A-Za-z]/).withMessage('Password needs at least 1 letter.').bail()
      .matches(/\d/).withMessage('Password needs at least 1 digit.'),
    body('confirmPassword')
      .isString().withMessage('Confirm your password.').bail()
      .custom((value, { req }) => value === req.body.password)
      .withMessage('The two passwords do not match.'),
  ],
  validate,
  controller.signup
);

router.post(
  '/verify-email',
  [
    emailRule,
    body('code')
      .isString().withMessage('Enter the 6-digit code.').bail()
      .trim()
      .matches(/^\d{6}$/).withMessage('The code is 6 digits.'),
  ],
  validate,
  controller.verifyEmail
);

router.post('/resend-code', [emailRule], validate, controller.resendCode);

router.post(
  '/login',
  [
    body('email')
      .isString().withMessage('Enter your email address.').bail()
      .trim().toLowerCase()
      .notEmpty().withMessage('Enter your email address.'),
    body('password')
      .isString().withMessage('Enter your password.').bail()
      .notEmpty().withMessage('Enter your password.'),
  ],
  validate,
  controller.login
);

router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);

module.exports = router;