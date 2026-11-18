import { isUpcoming, nowInPakistan } from '../../utils/dates';

// Sample data shared by all mock files while EXPO_PUBLIC_USE_MOCKS=true.
// Organisations and venues come from Master Document 8.2 and 8.3. Event dates are
// relative to today, so there are always upcoming and past events to look at.
// The events here follow the visibility rules in Section 5.8, so a student never sees
// Pending, Changes Requested or Rejected events.

const at = (days, hour, minute = 0) =>
  nowInPakistan().add(days, 'day').hour(hour).minute(minute).second(0).millisecond(0).toISOString();

const org = (id, name, category, description) => ({ id, name, category, description, isActive: true });

export const ORGS = {
  dss: org('org-dss', 'Data Science Society', 'society', 'Workshops, talks and competitions on data, AI and analytics.'),
  ess: org('org-ess', 'Entrepreneurship Society', 'society', 'Startup talks, pitch nights and founder meetups for IBA students.'),
  pss: org('org-pss', 'Public Speaking Society', 'society', 'Practice sessions and clinics to build confidence in public speaking.'),
  dram: org('org-dram', 'Dramatics Society', 'society', 'Theatre, stage plays and drama workshops at IBA.'),
  smcs: org('org-smcs', 'SMCS', 'school', 'School of Mathematics and Computer Science.'),
  sess: org('org-sess', 'SESS', 'school', 'School of Economics and Social Sciences.'),
  sbs: org('org-sbs', 'SBS', 'school', 'School of Business Studies.'),
  cedir: org('org-cedir', 'CEDIR', 'department', 'Center for Entrepreneurship Development, Innovation and Research.'),
  ossie: org('org-ossie', 'OSSIE', 'department', 'Office of Student Societies, Initiatives and Events.'),
  library: org('org-library', 'Library', 'department', 'The IBA Library.'),
};
export const ORG_LIST = Object.values(ORGS);
export const findOrg = (id) => ORG_LIST.find((o) => o.id === id);

export const CATEGORIES = [
  { key: 'society', label: 'Societies' },
  { key: 'school', label: 'Schools' },
  { key: 'department', label: 'Departments' },
];

const venue = (id, name, location, capacity) => ({ id, name, location, capacity, isActive: true });
export const VENUES = [
  venue('v-aud1', 'Auditorium 1', 'Main building', 300),
  venue('v-sem2', 'Seminar Room 2', 'Academic block', 60),
  venue('v-lab3', 'Lab 3', 'Computer science block', 40),
  venue('v-b12', 'Room B-12', 'Block B', 120),
  venue('v-lawn', 'Lawn', 'Central campus', 500),
];
export const findVenue = (id) => VENUES.find((v) => v.id === id) || null;

// Names for the createdBy field (the real ids and names come from the server).
const CREATORS = {
  'u-dss': 'DSS Organiser',
  'u-multi': 'Multi Organiser',
  'u-smcs': 'SMCS Organiser',
  'u-cedir': 'CEDIR Organiser',
  'u-dual': 'Dual Test',
};

const blank = {
  description: '',
  isOnline: false,
  venueId: null,
  capacity: 50,
  registrationRequired: false,
  attendanceEnabled: false,
  speakerName: '',
  speakerDesignation: '',
  presenterName: '',
  thesisTitle: '',
  supervisorName: '',
  status: 'APPROVED',
  cancelledAfterApproval: false,
  cancellationReason: null,
};

const e = (id, orgKey, createdBy, fields) => ({
  ...blank,
  id,
  organisationId: ORGS[orgKey].id,
  createdBy,
  createdAt: at(-14, 10),
  ...fields,
});

export const events = [
  e('ev-1', 'dss', 'u-dss', {
    title: 'AI in Industry: Panel Talk',
    description: 'Industry leaders talk about how AI is used in real companies in Pakistan, followed by questions from the audience.',
    eventType: 'Guest Speaker Session',
    startAt: at(3, 17), endAt: at(3, 19),
    venueId: 'v-aud1', capacity: 120, registrationRequired: true,
    speakerName: 'Dr. Ayesha Raza', speakerDesignation: 'CTO, XYZ',
  }),
  e('ev-2', 'dss', 'u-dss', {
    title: 'Intro to Machine Learning Workshop',
    description: 'A hands-on beginner workshop. Bring your laptop.',
    eventType: 'Workshop',
    startAt: at(10, 14), endAt: at(10, 17),
    venueId: 'v-lab3', capacity: 40, registrationRequired: true,
  }),
  e('ev-3', 'dss', 'u-dss', {
    title: 'Kaggle Night',
    description: 'An evening of team problem solving on a Kaggle dataset.',
    eventType: 'Session',
    startAt: at(-5, 18), endAt: at(-5, 21),
    venueId: 'v-b12', capacity: 100,
  }),
  e('ev-4', 'dss', 'u-dss', {
    title: 'Python Bootcamp',
    description: 'A one day introduction to Python for data work.',
    eventType: 'Workshop',
    startAt: at(5, 10), endAt: at(5, 16),
    venueId: 'v-lab3', capacity: 40, registrationRequired: true,
    status: 'CANCELLED', cancelledAfterApproval: true,
    cancellationReason: 'The trainer is unavailable on this date.',
  }),
  // Not visible to students (Section 5.8). Organisers and approvers of DSS can see these.
  e('ev-5', 'dss', 'u-dss', {
    title: 'Hackathon Kickoff', eventType: 'Flagship Event',
    description: 'Kickoff for the annual 24 hour hackathon.',
    startAt: at(12, 10), endAt: at(12, 12), venueId: 'v-aud1', capacity: 200, status: 'PENDING',
  }),
  e('ev-6', 'dss', 'u-dss', {
    title: 'Data Viz Masterclass', eventType: 'Session',
    description: 'Storytelling with charts.',
    startAt: at(14, 15), endAt: at(14, 17), venueId: 'v-sem2', capacity: 50, status: 'CHANGES_REQUESTED',
  }),
  e('ev-7', 'dss', 'u-dss', {
    title: 'Open Mic Night', eventType: 'Other',
    description: 'Open stage for anyone.',
    startAt: at(9, 19), endAt: at(9, 21), venueId: 'v-lawn', capacity: 150, status: 'REJECTED',
  }),
  e('ev-8', 'ess', 'u-multi', {
    title: 'Startup Pitch Night',
    description: 'Student teams pitch their ideas to a panel of founders and investors.',
    eventType: 'Flagship Event',
    startAt: at(6, 18), endAt: at(6, 21),
    venueId: 'v-lawn', capacity: 300, registrationRequired: true,
  }),
  e('ev-9', 'pss', 'u-multi', {
    title: 'Public Speaking Clinic',
    description: 'Join from anywhere. Short talks, live feedback and tips.',
    eventType: 'Session',
    startAt: at(2, 20), endAt: at(2, 21),
    isOnline: true, capacity: 200, registrationRequired: true,
  }),
  e('ev-10', 'smcs', 'u-smcs', {
    title: 'Thesis Defence: Graph Neural Networks',
    description: 'Public defence of an MS thesis on graph neural networks.',
    eventType: 'Thesis Defence',
    startAt: at(4, 11), endAt: at(4, 12, 30),
    venueId: 'v-sem2', capacity: 40,
    presenterName: 'Hira Anwar', thesisTitle: 'Link Prediction with Graph Neural Networks', supervisorName: 'Dr. Imran Qureshi',
  }),
  e('ev-11', 'cedir', 'u-cedir', {
    title: "Book Launch: Pakistan's Digital Economy",
    description: 'Launch of a new book on the growth of Pakistan\'s digital economy, with a talk and a signing.',
    eventType: 'Book Launch',
    startAt: at(8, 16), endAt: at(8, 17, 30),
    venueId: 'v-aud1', capacity: 250,
    speakerName: 'Mr. Faisal Mehmood', speakerDesignation: 'Author and economist',
  }),
  e('ev-12', 'sbs', 'u-dual', {
    title: 'Case Competition Finals',
    description: 'The final round of the annual business case competition.',
    eventType: 'Other',
    startAt: at(-30, 10), endAt: at(-30, 15),
    venueId: 'v-b12', capacity: 100,
  }),
];

// Starting history for each event (FR-APR-08). Later screens add to these lists.
const person = (id, fullName) => ({ id, fullName });
function startingHistory(ev) {
  const maker = person(ev.createdBy, CREATORS[ev.createdBy] || 'Organiser');
  const entries = [
    { fromStatus: null, toStatus: 'PENDING', actor: maker, actorRole: 'organiser', comment: '', createdAt: at(-13, 11) },
  ];
  const approver = person('u-oss', 'OSS Approver');
  if (ev.status === 'APPROVED' || (ev.status === 'CANCELLED' && ev.cancelledAfterApproval)) {
    entries.push({ fromStatus: 'PENDING', toStatus: 'APPROVED', actor: approver, actorRole: 'approver', comment: '', createdAt: at(-12, 9) });
  }
  if (ev.status === 'CANCELLED') {
    entries.push({ fromStatus: 'APPROVED', toStatus: 'CANCELLED', actor: maker, actorRole: 'organiser', comment: ev.cancellationReason || '', createdAt: at(-2, 15) });
  }
  if (ev.status === 'REJECTED') {
    entries.push({ fromStatus: 'PENDING', toStatus: 'REJECTED', actor: approver, actorRole: 'approver', comment: 'Another large event is already planned that evening.', createdAt: at(-10, 9) });
  }
  if (ev.status === 'CHANGES_REQUESTED') {
    entries.push({ fromStatus: 'PENDING', toStatus: 'CHANGES_REQUESTED', actor: approver, actorRole: 'approver', comment: 'Please add the speaker name and a clearer description.', createdAt: at(-9, 9) });
  }
  return entries;
}
events.forEach((ev) => {
  ev.history = startingHistory(ev);
});

// ---- Visibility rules (Master Document 5.8) ----
export const isPublic = (ev) =>
  ev.status === 'APPROVED' || (ev.status === 'CANCELLED' && ev.cancelledAfterApproval);

const linked = (user, organisationId, type) =>
  user.affiliations.some((a) => a.organisationId === organisationId && a.type === type);

export const canSeeHistory = (user, ev) =>
  user.roles.includes('admin') || linked(user, ev.organisationId, 'organiser') || linked(user, ev.organisationId, 'approver');

export const canSeeEvent = (user, ev) => isPublic(ev) || canSeeHistory(user, ev);

// Turn a stored event into the Event object from Section 6.1.
export function toEventObject(ev, { withHistory = false } = {}) {
  const organisation = findOrg(ev.organisationId);
  const place = ev.venueId ? findVenue(ev.venueId) : null;
  const result = {
    id: ev.id,
    organisationId: ev.organisationId,
    organisationName: organisation ? organisation.name : '',
    category: organisation ? organisation.category : '',
    title: ev.title,
    description: ev.description,
    eventType: ev.eventType,
    startAt: ev.startAt,
    endAt: ev.endAt,
    isOnline: ev.isOnline,
    venue: place ? { id: place.id, name: place.name, capacity: place.capacity } : null,
    capacity: ev.capacity,
    registrationRequired: ev.registrationRequired,
    attendanceEnabled: ev.attendanceEnabled,
    speakerName: ev.speakerName,
    speakerDesignation: ev.speakerDesignation,
    presenterName: ev.presenterName,
    thesisTitle: ev.thesisTitle,
    supervisorName: ev.supervisorName,
    status: ev.status,
    cancelledAfterApproval: ev.cancelledAfterApproval,
    cancellationReason: ev.cancellationReason,
    createdBy: { id: ev.createdBy, fullName: CREATORS[ev.createdBy] || 'Organiser' },
    createdAt: ev.createdAt,
  };
  if (withHistory) result.history = ev.history;
  return result;
}

export const upcomingCountFor = (organisationId) =>
  events.filter((ev) => ev.organisationId === organisationId && ev.status === 'APPROVED' && isUpcoming(ev.endAt)).length;
