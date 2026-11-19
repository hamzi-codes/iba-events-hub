// Central place for environment values and the mock-data switch (Master Document 5.4, 7.5).
// No secrets here: EXPO_PUBLIC_* values are visible inside the app bundle.

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Global switch. true means screens use sample data from src/api/mock/.
//  - EXPO_PUBLIC_USE_MOCKS=true   -> mocks on
//  - EXPO_PUBLIC_USE_MOCKS=false  -> real API (set this once the endpoints exist)
//  - not set at all               -> mocks on while EXPO_PUBLIC_API_URL is also empty
//    (a fresh clone with no .env still runs), real API as soon as a URL is set.
// Do not leave mocks on at submission.
const mockFlag = process.env.EXPO_PUBLIC_USE_MOCKS;
export const USE_MOCKS = mockFlag === 'true' || (mockFlag === undefined && !API_URL);

// Per-area override, so you can switch mocks off one part at a time as the
// backend announces "endpoint ready" (Master Document A.4).
//   null  = follow USE_MOCKS
//   false = always use the real API for this area
//   true  = always use mock data for this area
const MOCK_OVERRIDES = {
  auth: null,
  browse: null,
  events: null,
  approvals: null,
  admin: null,
};

export function mockEnabled(area) {
  const override = MOCK_OVERRIDES[area];
  return override === null || override === undefined ? USE_MOCKS : override;
}

if (USE_MOCKS) {
  // eslint-disable-next-line no-console
  console.warn('[IBA Events Hub] Mock data is ON. Set EXPO_PUBLIC_USE_MOCKS=false to use the API.');
} else if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn('EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and fill it in.');
}
