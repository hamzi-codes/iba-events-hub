const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { User, Organisation, Venue, Setting, Event, EventHistory } = require('../models');

const args = process.argv.slice(2);
const RESET = args.includes('--reset');
const SAMPLE_EVENTS = args.includes('--sample-events');

// ---------- Section 5.9 and 8 data ----------

const DOMAINS = ['iba.edu.pk', 'khi.iba.edu.pk']; // decision D10

const EVENT_TYPES = {
  society: ['Flagship Event', 'Session', 'Workshop', 'Guest Speaker Session', 'Other'],
  school: [
    'Thesis Defence',
    'PhD Presentation',
    'Faculty Research Presentation',
    'Faculty Talk',
    'Training Bootcamp',
    'Other',
  ],
  department: ['Session', 'Workshop', 'Interview', 'Book Launch', 'Other'],
};

const VENUES = [
  { name: 'Auditorium 1', capacity: 300 },
  { name: 'Seminar Room 2', capacity: 60 },
  { name: 'Lab 3', capacity: 40 },
  { name: 'Room B-12', capacity: 120 },
  { name: 'Lawn', capacity: 500 },
];

const ORGANISATIONS = [
  { category: 'society', name: 'Data Science Society', description: '' },
  { category: 'society', name: 'Entrepreneurship Society', description: '' },
  { category: 'society', name: 'Public Speaking Society', description: '' },
  { category: 'society', name: 'Dramatics Society', description: '' },
  { category: 'school', name: 'SMCS', description: 'School of Mathematics and Computer Science' },
  { category: 'school', name: 'SESS', description: 'School of Economics and Social Sciences' },
  { category: 'school', name: 'SBS', description: 'School of Business Studies' },
  { category: 'department', name: 'CEDIR', description: '' },
  { category: 'department', name: 'OSSIE', description: '' },
  { category: 'department', name: 'Library', description: '' },
];

const SOCIETIES = ['Data Science Society', 'Entrepreneurship Society', 'Public Speaking Society', 'Dramatics Society'];
const D = '@iba.edu.pk';
const org = (name, type) => ({ name, type });

const ACCOUNTS = [
  { email: env.seedAdminEmail || `admin.test${D}`, fullName: 'Test Admin', roles: ['student', 'admin'], links: [] },
  { email: `student.test${D}`, fullName: 'Test Student', roles: ['student'], links: [] },
  { email: `student2.test${D}`, fullName: 'Test Student Two', roles: ['student'], links: [] },
  { email: `dss.organiser.test${D}`, fullName: 'DSS Organiser', roles: ['student', 'organiser'], links: [org('Data Science Society', 'organiser')] },
  {
    email: `multi.organiser.test${D}`,
    fullName: 'Multi Organiser',
    roles: ['student', 'organiser'],
    links: [org('Data Science Society', 'organiser'), org('Entrepreneurship Society', 'organiser')],
  },
  { email: `smcs.organiser.test${D}`, fullName: 'SMCS Organiser', roles: ['student', 'organiser'], links: [org('SMCS', 'organiser')] },
  { email: `cedir.organiser.test${D}`, fullName: 'CEDIR Organiser', roles: ['student', 'organiser'], links: [org('CEDIR', 'organiser')] },
  { email: `oss.approver.test${D}`, fullName: 'OSS Approver', roles: ['student', 'approver'], links: SOCIETIES.map((n) => org(n, 'approver')) },
  { email: `oss2.approver.test${D}`, fullName: 'OSS Approver Two', roles: ['student', 'approver'], links: SOCIETIES.map((n) => org(n, 'approver')) },
  { email: `smcs.dean.test${D}`, fullName: 'SMCS Dean', roles: ['student', 'approver'], links: [org('SMCS', 'approver')] },
  { email: `cedir.head.test${D}`, fullName: 'CEDIR Head', roles: ['student', 'approver'], links: [org('CEDIR', 'approver')] },
  {
    email: `dual.test${D}`,
    fullName: 'Dual Role Test',
    roles: ['student', 'organiser', 'approver'],
    links: [org('SBS', 'organiser'), org('SBS', 'approver')],
  },
];

// ---------- helpers ----------

// A time in Pakistan (UTC+5, no daylight saving), stored as a UTC Date.
function pkt(daysFromNow, hour, minute = 0) {
  const shifted = new Date(Date.now() + daysFromNow * 86400000 + 5 * 3600000);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), hour - 5, minute)
  );
}

// ---------- seeding steps ----------

async function reset() {
  if (env.nodeEnv === 'production') {
    throw new Error('Refusing to reset when NODE_ENV=production.');
  }
  console.log('RESET: clearing all collections (including real sign-ups)...');
  await Promise.all([
    User.deleteMany({}),
    Organisation.deleteMany({}),
    Venue.deleteMany({}),
    Setting.deleteMany({}),
    Event.deleteMany({}),
    // eventHistory blocks deletes in the model (NFR-SEC-08), so this dev-only reset uses the raw driver.
    EventHistory.collection.deleteMany({}),
  ]);
}

async function seedSettings() {
  await Setting.updateOne(
    {},
    { $setOnInsert: { allowedEmailDomains: DOMAINS, eventTypes: EVENT_TYPES } },
    { upsert: true }
  );
}

async function seedVenues() {
  for (const v of VENUES) {
    await Venue.updateOne(
      { name: v.name },
      { $setOnInsert: { capacity: v.capacity, location: '', isActive: true } },
      { upsert: true }
    );
  }
}

async function seedOrganisations() {
  for (const o of ORGANISATIONS) {
    await Organisation.updateOne(
      { category: o.category, name: o.name },
      { $setOnInsert: { description: o.description, isActive: true } },
      { upsert: true }
    );
  }
  const all = await Organisation.find();
  return Object.fromEntries(all.map((o) => [o.name, o]));
}

async function seedUsers(orgs) {
  const users = {};
  for (const a of ACCOUNTS) {
    const email = a.email.toLowerCase();
    const affiliations = a.links.map((l) => ({
      organisationId: orgs[l.name]._id,
      type: l.type,
    }));
    await User.updateOne(
      { email },
      {
        $set: {
          fullName: a.fullName,
          passwordHash: await bcrypt.hash(env.seedPassword, 10),
          roles: a.roles,
          affiliations,
          isVerified: true,
          isActive: true,
          failedLoginCount: 0,
          lockUntil: null,
          verifyCodeHash: null,
          verifyCodeExpiresAt: null,
          verifyResendCount: 0,
          verifyResendWindowStart: null,
        },
      },
      { upsert: true }
    );
    users[email] = await User.findOne({ email });
  }
  return users;
}

async function seedSampleEvents(orgs, venues, users) {
  const u = (prefix) => users[`${prefix}${D}`];
  const dss = u('dss.organiser.test');
  const multi = u('multi.organiser.test');
  const smcs = u('smcs.organiser.test');
  const cedir = u('cedir.organiser.test');
  const oss = u('oss.approver.test');
  const dean = u('smcs.dean.test');
  const head = u('cedir.head.test');

  const step = (from, to, by, role, comment = '') => ({ from, to, by, role, comment });

  const defs = [
    {
      title: 'AI in Industry: Panel Talk',
      org: 'Data Science Society', by: dss, eventType: 'Guest Speaker Session',
      start: pkt(5, 17), end: pkt(5, 19), venue: 'Auditorium 1', capacity: 120, registrationRequired: true,
      speakerName: 'Dr. Ayesha Raza', speakerDesignation: 'CTO, XYZ',
      description: 'A panel on how companies use AI in practice.',
      status: 'APPROVED',
      history: [step(null, 'PENDING', dss, 'organiser'), step('PENDING', 'APPROVED', oss, 'approver', 'Looks good.')],
    },
    {
      title: 'Startup Pitch Night',
      org: 'Entrepreneurship Society', by: multi, eventType: 'Flagship Event',
      start: pkt(8, 18), end: pkt(8, 21), venue: 'Lawn', capacity: 400, registrationRequired: false,
      description: 'Student teams pitch their startup ideas to a panel of founders.',
      status: 'APPROVED',
      history: [step(null, 'PENDING', multi, 'organiser'), step('PENDING', 'APPROVED', oss, 'approver')],
    },
    {
      title: 'Python for Data Analysis Workshop',
      org: 'Data Science Society', by: dss, eventType: 'Workshop',
      start: pkt(4, 14), end: pkt(4, 16), venue: 'Lab 3', capacity: 35, registrationRequired: true,
      description: 'A hands-on workshop on pandas and plotting.',
      status: 'CANCELLED', cancelledAfterApproval: true, cancellationReason: 'The trainer is unavailable on this date.',
      history: [
        step(null, 'PENDING', dss, 'organiser'),
        step('PENDING', 'APPROVED', oss, 'approver'),
        step('APPROVED', 'CANCELLED', dss, 'organiser', 'The trainer is unavailable on this date.'),
      ],
    },
    {
      title: 'Data Hackathon Briefing',
      org: 'Data Science Society', by: dss, eventType: 'Session',
      start: pkt(-10, 15), end: pkt(-10, 16), venue: 'Room B-12', capacity: 100, registrationRequired: false,
      description: 'Briefing for all hackathon participants (past event for testing the Past tab).',
      status: 'APPROVED',
      history: [step(null, 'PENDING', dss, 'organiser'), step('PENDING', 'APPROVED', oss, 'approver')],
    },
    {
      title: 'Networking Mixer',
      org: 'Entrepreneurship Society', by: multi, eventType: 'Session',
      start: pkt(6, 17), end: pkt(6, 19), venue: 'Room B-12', capacity: 80, registrationRequired: false,
      description: 'An informal evening to meet alumni founders.',
      status: 'REJECTED',
      history: [
        step(null, 'PENDING', multi, 'organiser'),
        step('PENDING', 'REJECTED', oss, 'approver', 'The date clashes with the university fair. Please choose another week.'),
      ],
    },
    {
      title: 'MS Thesis Defence: Graph Neural Networks',
      org: 'SMCS', by: smcs, eventType: 'Thesis Defence',
      start: pkt(3, 11), end: pkt(3, 12), venue: 'Seminar Room 2', capacity: 30, registrationRequired: false,
      presenterName: 'Hira Khan', thesisTitle: 'Graph Neural Networks for Fraud Detection', supervisorName: 'Dr. Imran Ali',
      description: 'Public defence of an MS thesis.',
      status: 'PENDING',
      history: [step(null, 'PENDING', smcs, 'organiser')],
    },
    {
      title: 'Faculty Talk: Research Trends in AI',
      org: 'SMCS', by: smcs, eventType: 'Faculty Talk',
      start: pkt(7, 15), end: pkt(7, 16, 30), venue: null, isOnline: true, capacity: 150, registrationRequired: true,
      speakerName: 'Dr. Sana Malik', speakerDesignation: 'Associate Professor, SMCS',
      description: 'An online talk on current research directions.',
      status: 'APPROVED',
      history: [step(null, 'PENDING', smcs, 'organiser'), step('PENDING', 'APPROVED', dean, 'approver')],
    },
    {
      title: 'Career Skills Workshop',
      org: 'CEDIR', by: cedir, eventType: 'Workshop',
      start: pkt(9, 10), end: pkt(9, 12), venue: 'Room B-12', capacity: 60, registrationRequired: true,
      description: 'CV writing and interview basics.',
      status: 'CHANGES_REQUESTED',
      history: [
        step(null, 'PENDING', cedir, 'organiser'),
        step('PENDING', 'CHANGES_REQUESTED', head, 'approver', 'Please add the trainer name to the description and confirm the capacity.'),
      ],
    },
  ];

  let created = 0;
  for (const d of defs) {
    const organisationId = orgs[d.org]._id;
    if (await Event.exists({ title: d.title, organisationId })) continue;

    const event = await Event.create({
      organisationId,
      createdBy: d.by._id,
      title: d.title,
      description: d.description,
      eventType: d.eventType,
      startAt: d.start,
      endAt: d.end,
      venueId: d.venue ? venues[d.venue]._id : null,
      isOnline: Boolean(d.isOnline),
      capacity: d.capacity,
      registrationRequired: d.registrationRequired,
      speakerName: d.speakerName || '',
      speakerDesignation: d.speakerDesignation || '',
      presenterName: d.presenterName || '',
      thesisTitle: d.thesisTitle || '',
      supervisorName: d.supervisorName || '',
      status: d.status,
      cancelledAfterApproval: Boolean(d.cancelledAfterApproval),
      cancellationReason: d.cancellationReason || null,
    });

    for (const h of d.history) {
      await EventHistory.create({
        eventId: event._id,
        fromStatus: h.from,
        toStatus: h.to,
        actorId: h.by._id,
        actorRole: h.role,
        comment: h.comment,
      });
    }
    created += 1;
  }
  console.log(`Sample events created this run: ${created} (existing ones were skipped)`);
}

// ---------- main ----------

async function main() {
  if (!env.seedPassword || env.seedPassword.length < 8) {
    console.error('SEED_PASSWORD is missing or shorter than 8 characters. Set it in backend/.env (for example Test@1234).');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');

  if (RESET) await reset();

  await seedSettings();
  await seedVenues();
  const orgs = await seedOrganisations();
  const users = await seedUsers(orgs);

  if (SAMPLE_EVENTS) {
    const venueDocs = await Venue.find();
    const venues = Object.fromEntries(venueDocs.map((v) => [v.name, v]));
    await seedSampleEvents(orgs, venues, users);
  }

  console.log('--- Totals in the database ---');
  console.log('Settings      :', await Setting.countDocuments());
  console.log('Venues        :', await Venue.countDocuments());
  console.log('Organisations :', await Organisation.countDocuments());
  console.log('Users         :', await User.countDocuments());
  console.log('Events        :', await Event.countDocuments());
  console.log('Event history :', await EventHistory.countDocuments());
  console.log('Test accounts use the password from SEED_PASSWORD in backend/.env');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});