import { ApiError } from '../ApiError';
import { getToken } from '../tokenStorage';
import { ORGS } from './mockData';
import { delay } from './mockUtils';

// Sample data and rules for the auth endpoints (Master Document 6.2), used while
// EXPO_PUBLIC_USE_MOCKS=true. It copies the server rules so the screens can be built
// and checked before the API exists. It is not a security layer.
//
// Try these on the Login screen. The password for every account is Test@1234.
//   student.test@iba.edu.pk        student
//   dss.organiser.test@iba.edu.pk  organiser (Data Science Society)
//   multi.organiser.test@iba.edu.pk  organiser (two societies)
//   oss.approver.test@iba.edu.pk   approver
//   dual.test@iba.edu.pk           organiser and approver
//   admin.test@iba.edu.pk          admin
//   deactivated.mock@iba.edu.pk    shows the "account not active" message
//   unverified.mock@iba.edu.pk     goes to Verify (code 123456)
// Five wrong passwords lock an account (ACCOUNT_LOCKED). Verify code: 123456 is
// correct, 000000 is expired, anything else is wrong.

const MOCK_PASSWORD = 'Test@1234';
const MOCK_CODE = '123456';
const EXPIRED_CODE = '000000';
const ALLOWED_DOMAINS = ['iba.edu.pk', 'khi.iba.edu.pk'];

const link = (o, type) => ({
  organisationId: o.id,
  organisationName: o.name,
  category: o.category,
  type,
});
const societies = [ORGS.dss, ORGS.ess, ORGS.pss, ORGS.dram];

const users = [
  { id: 'u-admin', fullName: 'Admin Test', email: 'admin.test@iba.edu.pk', roles: ['student', 'admin'], affiliations: [] },
  { id: 'u-stu1', fullName: 'Student Test', email: 'student.test@iba.edu.pk', roles: ['student'], affiliations: [] },
  { id: 'u-stu2', fullName: 'Student Two', email: 'student2.test@iba.edu.pk', roles: ['student'], affiliations: [] },
  { id: 'u-dss', fullName: 'DSS Organiser', email: 'dss.organiser.test@iba.edu.pk', roles: ['student', 'organiser'], affiliations: [link(ORGS.dss, 'organiser')] },
  { id: 'u-multi', fullName: 'Multi Organiser', email: 'multi.organiser.test@iba.edu.pk', roles: ['student', 'organiser'], affiliations: [link(ORGS.dss, 'organiser'), link(ORGS.ess, 'organiser')] },
  { id: 'u-smcs', fullName: 'SMCS Organiser', email: 'smcs.organiser.test@iba.edu.pk', roles: ['student', 'organiser'], affiliations: [link(ORGS.smcs, 'organiser')] },
  { id: 'u-cedir', fullName: 'CEDIR Organiser', email: 'cedir.organiser.test@iba.edu.pk', roles: ['student', 'organiser'], affiliations: [link(ORGS.cedir, 'organiser')] },
  { id: 'u-oss', fullName: 'OSS Approver', email: 'oss.approver.test@iba.edu.pk', roles: ['student', 'approver'], affiliations: societies.map((o) => link(o, 'approver')) },
  { id: 'u-oss2', fullName: 'OSS Approver Two', email: 'oss2.approver.test@iba.edu.pk', roles: ['student', 'approver'], affiliations: societies.map((o) => link(o, 'approver')) },
  { id: 'u-dean', fullName: 'SMCS Dean', email: 'smcs.dean.test@iba.edu.pk', roles: ['student', 'approver'], affiliations: [link(ORGS.smcs, 'approver')] },
  { id: 'u-head', fullName: 'CEDIR Head', email: 'cedir.head.test@iba.edu.pk', roles: ['student', 'approver'], affiliations: [link(ORGS.cedir, 'approver')] },
  { id: 'u-dual', fullName: 'Dual Test', email: 'dual.test@iba.edu.pk', roles: ['student', 'organiser', 'approver'], affiliations: [link(ORGS.sbs, 'organiser'), link(ORGS.sbs, 'approver')] },
  // Mock-only accounts for trying error states. They are not in the real seed script.
  { id: 'u-inactive', fullName: 'Deactivated Mock', email: 'deactivated.mock@iba.edu.pk', roles: ['student'], affiliations: [], isActive: false },
  { id: 'u-unverified', fullName: 'Unverified Mock', email: 'unverified.mock@iba.edu.pk', roles: ['student'], affiliations: [], isVerified: false },
].map((u) => ({
  password: MOCK_PASSWORD,
  isActive: true,
  isVerified: true,
  failedLoginCount: 0,
  resendCount: 0,
  ...u,
}));

const publicUser = ({ id, fullName, email, roles, affiliations }) => ({
  id,
  fullName,
  email,
  roles,
  affiliations,
});

const findByEmail = (email) =>
  users.find((u) => u.email === String(email || '').trim().toLowerCase());

const tokenFor = (user) => `mock-token.${user.id}`;

export async function signup({ fullName, email, password, confirmPassword }) {
  await delay();
  const fields = {};
  const name = String(fullName || '').trim();
  const mail = String(email || '').trim().toLowerCase();

  if (name.length < 2 || name.length > 60) fields.fullName = 'Enter a name of 2 to 60 characters.';
  if (!mail.includes('@')) fields.email = 'Enter a valid email address.';
  else if (!ALLOWED_DOMAINS.includes(mail.split('@')[1])) {
    fields.email = `Use your IBA email address (${ALLOWED_DOMAINS.map((d) => `@${d}`).join(' or ')}).`;
  }
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    fields.password = 'Use at least 8 characters with at least 1 letter and 1 digit.';
  }
  if (confirmPassword !== password) fields.confirmPassword = 'The two passwords do not match.';
  if (Object.keys(fields).length) {
    throw new ApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields.', fields });
  }

  if (findByEmail(mail)) {
    throw new ApiError({
      status: 409,
      code: 'EMAIL_TAKEN',
      message: 'This email is already registered. Log in instead, or use a different email.',
    });
  }

  users.push({
    id: `u-new-${users.length}`,
    fullName: name,
    email: mail,
    password,
    roles: ['student'],
    affiliations: [],
    isActive: true,
    isVerified: false,
    failedLoginCount: 0,
    resendCount: 0,
  });
  return { message: 'Account created. We sent a 6-digit code to your email.' };
}

export async function verifyEmail({ email, code }) {
  await delay();
  const user = findByEmail(email);
  if (!user) throw new ApiError({ status: 400, code: 'INVALID_CODE', message: 'That code is not correct. Check it and try again.' });
  if (code === EXPIRED_CODE) {
    throw new ApiError({ status: 400, code: 'CODE_EXPIRED', message: 'This code has expired. Tap Resend to get a new one.' });
  }
  if (code !== MOCK_CODE) {
    throw new ApiError({ status: 400, code: 'INVALID_CODE', message: 'That code is not correct. Check it and try again.' });
  }
  user.isVerified = true;
  return { message: 'Email verified. You can log in now.' };
}

export async function resendCode({ email }) {
  await delay();
  const user = findByEmail(email);
  if (user) {
    user.resendCount += 1;
    if (user.resendCount > 5) {
      throw new ApiError({ status: 429, code: 'TOO_MANY_REQUESTS', message: 'Too many codes requested. Wait an hour and try again.' });
    }
  }
  return { message: 'A new code was sent.' };
}

export async function login({ email, password }) {
  await delay();
  const invalid = new ApiError({
    status: 401,
    code: 'INVALID_CREDENTIALS',
    message: 'The email or password is incorrect. Check both and try again.',
  });
  const user = findByEmail(email);
  if (!user) throw invalid;

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new ApiError({ status: 429, code: 'ACCOUNT_LOCKED', message: 'Too many wrong attempts. This account is locked for 15 minutes.' });
  }
  if (password !== user.password) {
    user.failedLoginCount += 1;
    if (user.failedLoginCount >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000;
      user.failedLoginCount = 0;
      throw new ApiError({ status: 429, code: 'ACCOUNT_LOCKED', message: 'Too many wrong attempts. This account is locked for 15 minutes.' });
    }
    throw invalid;
  }
  user.failedLoginCount = 0;
  if (!user.isVerified) {
    throw new ApiError({ status: 403, code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email first. We sent you a 6-digit code.' });
  }
  if (!user.isActive) {
    throw new ApiError({ status: 403, code: 'ACCOUNT_DEACTIVATED', message: 'This account is not active. Contact your system administrator.' });
  }
  return { token: tokenFor(user), user: publicUser(user) };
}

// The full user list, for the admin mock (it edits roles, links and status).
export const getAllUsers = () => users;

// The signed-in user for the other mock files, so they can apply role rules.
export async function getCurrentUser() {
  const token = await getToken();
  const user = token && users.find((u) => tokenFor(u) === token);
  if (!user) throw new ApiError({ status: 401, code: 'UNAUTHENTICATED', message: 'Please log in again.' });
  return publicUser(user);
}

export async function getMe() {
  await delay(200);
  const token = await getToken();
  const user = token && users.find((u) => tokenFor(u) === token);
  if (!user) throw new ApiError({ status: 401, code: 'UNAUTHENTICATED', message: 'Please log in again.' });
  return publicUser(user);
}

export async function logout() {
  await delay(100);
}
