// Every failed call, real or mock, reaches the screens as an ApiError, so screens
// handle one shape only. It mirrors the server error body (Master Document 6.1):
// { error: { code, message, fields } }.
export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message, fields = null }) {
    super(message || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const NETWORK_MESSAGE =
  'Cannot reach the server. Check your internet connection and try again. The server may need a minute to wake up.';
const TIMEOUT_MESSAGE =
  'The server took too long to answer. Check your internet connection and try again. If the server was idle, wait a minute first.';
const UNKNOWN_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';

// Turn an axios error into an ApiError.
export function toApiError(error) {
  if (error instanceof ApiError) return error;

  const body = error?.response?.data?.error;
  if (error?.response && body && typeof body === 'object') {
    return new ApiError({
      status: error.response.status,
      code: body.code || 'UNKNOWN',
      message: body.message,
      fields: body.fields || null,
    });
  }
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return new ApiError({ code: 'TIMEOUT', message: TIMEOUT_MESSAGE });
  }
  if (!error?.response) {
    return new ApiError({ code: 'NETWORK_ERROR', message: NETWORK_MESSAGE });
  }
  return new ApiError({ status: error.response.status, code: 'UNKNOWN', message: UNKNOWN_MESSAGE });
}
