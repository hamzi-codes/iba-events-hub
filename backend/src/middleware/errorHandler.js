// Use `throw new ApiError(409, 'EMAIL_TAKEN', 'message')` anywhere in a controller.
class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'We could not find what you asked for. Check the address and try again.',
    },
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { code: err.code, message: err.message };
    if (err.fields) body.fields = err.fields;
    return res.status(err.status).json({ error: body });
  }

  // Broken JSON in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request was not valid JSON. Check what you sent and try again.',
      },
    });
  }

  // Bad ObjectId in a URL, e.g. /events/abc
  if (err.name === 'CastError') {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'We could not find what you asked for. Check the address and try again.',
      },
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Some details are not valid. Fix them and try again.',
      },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side. Please try again in a moment.',
    },
  });
}

module.exports = { ApiError, notFound, errorHandler };