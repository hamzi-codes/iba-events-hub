const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Put after the express-validator rules:
// router.post('/signup', [body('email').isString()...], validate, controller)
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const fields = {};
  result.array({ onlyFirstError: true }).forEach((e) => {
    const key = e.path || e.param;
    if (key && !fields[key]) fields[key] = e.msg;
  });

  return next(
    new ApiError(
      400,
      'VALIDATION_ERROR',
      'Some details need fixing. Check the highlighted fields and try again.',
      fields
    )
  );
}

module.exports = validate;