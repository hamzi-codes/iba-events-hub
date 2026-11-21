# IBA Events Hub

A mobile app where IBA students discover events of societies, schools and departments, organisers create events, approving authorities approve them, and admins manage users, organisations and venues.

Software Engineering course project, Team 08, IBA Karachi. Current release: **Sprint 1** (tag `sprint-1`).

## Tech stack

- Mobile: React Native with Expo (Expo Go on a phone)
- Backend: Node.js, Express 5, Mongoose
- Database: MongoDB Atlas
- Hosting: Vercel (the API runs as a serverless function)
- Email: Nodemailer (verification codes, see "Known issues")
- API tests: Postman collections (run with Postman or Newman)

## What Sprint 1 includes

- Sign up with an IBA email, email verification code, login with a 7-day session, role-based tabs, account lock after 5 wrong passwords
- Browse events by Societies, Schools and Departments, organisation pages with Upcoming and Past, event details (approved events only for students)
- Organisers: two-step event form, live venue-conflict check, submit for approval, My Submissions, edit after changes were requested and resubmit, cancel
- Approving authorities: pending queue, review screen with history, approve, reject (comment required), request changes (comment required), decided events
- Admin: users and roles, deactivate and reactivate, organisations with their approvers and organisers, venues, all events, accepted email domains and event types
- Every status change is written to a permanent, append-only event history

## Folder structure

```
backend/   the API (Express, Mongoose, seed script)
mobile/    the Expo app
tests/     Postman collections and environments
docs/      SRS v1.1, wireframes v1.1, product backlog v1.1, Sprint 1 documents,
           deviations.md, api-decisions.md
```

## Prerequisites

- Node.js 20 or newer and npm
- Git
- A MongoDB Atlas database (free M0 cluster) and its connection string
- Expo Go on a phone (same Wi-Fi as your laptop when using a local backend)
- Postman (or `npx newman`) to run the API tests

## Run the backend

```
git clone https://github.com/hamzi-codes/iba-events-hub
cd iba-events-hub/backend
npm install
copy .env.example .env        (macOS or Linux: cp .env.example .env)
```

Open `backend/.env` and fill in the values:

| Variable                     | What to put                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                | Your Atlas connection string, ending in `/iba-events-hub?retryWrites=true&w=majority`                             |
| `JWT_SECRET`                 | A long random string, for example from `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `EMAIL_MODE`                 | `console` for development (the verification code is printed in the server terminal)                               |
| `REQUIRE_EMAIL_VERIFICATION` | `true` to test the full verification flow, `false` to skip it                                                     |
| `SEED_ADMIN_EMAIL`           | `admin.test@iba.edu.pk`                                                                                           |
| `SEED_PASSWORD`              | A test password such as `Test@1234` (8+ characters, a letter and a digit)                                         |

Then:

```
npm run seed                          # settings, 5 venues, 10 organisations, 12 test accounts
npm run seed -- --sample-events       # optional: 8 demo events in every status, with history
npm run dev                           # API on http://localhost:5000
```

Check it: open `http://localhost:5000/api/v1/health` and expect `{"status":"ok"}`.

Seed options:

- Running the seed again is safe. It adds what is missing and restores the test accounts (unlocked, active, verified, original roles).
- `npm run seed -- --reset` empties every collection first, including real sign-ups. Never use it on data you want to keep. It refuses to run when `NODE_ENV=production`.

## Run the mobile app

```
cd mobile
npm install
copy .env.example .env
```

In `mobile/.env` set:

```
EXPO_PUBLIC_API_URL=<API address>/api/v1
EXPO_PUBLIC_USE_MOCKS=false
```

- Local backend from a phone: `EXPO_PUBLIC_API_URL=http://<your-laptop-IPv4>:5000/api/v1` (find the address with `ipconfig`). Allow Node through the Windows firewall if asked.
- Deployed backend: use the address in the next section.

Then run `npx expo start` and open the app in Expo Go. Mock data is only for working without a backend and must stay off for real use.

## Deployed API

- API address: https://iba-events-hub-api.vercel.app/api/v1
- Health check: https://iba-events-hub-api.vercel.app/api/v1/health
- App setting: `EXPO_PUBLIC_API_URL=https://iba-events-hub-api.vercel.app/api/v1`
- The API runs as a serverless function on Vercel, so the first request after a quiet period can take a second or two. Open the health check before a demonstration to warm it up.

## Test accounts (test data only)

All accounts are created by `npm run seed` and share the password you put in `SEED_PASSWORD` (the examples in this project use `Test@1234`).

| Email                             | Role                              | Linked to                                      |
| --------------------------------- | --------------------------------- | ---------------------------------------------- |
| `admin.test@iba.edu.pk`           | Admin                             | none                                           |
| `student.test@iba.edu.pk`         | Student                           | none                                           |
| `student2.test@iba.edu.pk`        | Student                           | none                                           |
| `dss.organiser.test@iba.edu.pk`   | Organiser                         | Data Science Society                           |
| `multi.organiser.test@iba.edu.pk` | Organiser                         | Data Science Society, Entrepreneurship Society |
| `smcs.organiser.test@iba.edu.pk`  | Organiser                         | SMCS                                           |
| `cedir.organiser.test@iba.edu.pk` | Organiser                         | CEDIR                                          |
| `oss.approver.test@iba.edu.pk`    | Approving authority               | the four societies                             |
| `oss2.approver.test@iba.edu.pk`   | Approving authority               | the four societies                             |
| `smcs.dean.test@iba.edu.pk`       | Approving authority               | SMCS                                           |
| `cedir.head.test@iba.edu.pk`      | Approving authority               | CEDIR                                          |
| `dual.test@iba.edu.pk`            | Organiser and approving authority | SBS (both)                                     |

Every organiser and approver is also a student. These are test credentials only. Never use real passwords in this project.

## How to run the tests

API tests are Postman collections in `tests/postman/`:

| Collection             | Covers                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `Ali_Auth_Events_API`  | Auth (6.2), organiser events (6.4), conflict detection (5.10) |
| `Danial_Browse_API`    | Browse (6.3)                                                  |
| `Danial_Approvals_API` | Approvals (6.5)                                               |
| `Danial_Admin_API`     | Admin (6.6)                                                   |

1. Start the backend and run `npm run seed`.
2. In Postman choose Import and add the collections and `Ali_Local.postman_environment.json` (or `Danial_Local.postman_environment.json`).
3. In the environment set `baseUrl` (default `http://localhost:5000/api/v1`) and `testPassword` (your `SEED_PASSWORD`).
4. Run each collection with the Collection Runner, folder 0 first. Each request has automatic checks.

With Newman, from the repository root:

```
npx newman run tests/postman/Ali_Auth_Events_API.postman_collection.json -e tests/postman/Ali_Local.postman_environment.json --env-var "testPassword=Test@1234"
```

The last folder of the Ali collection ("Z - Account lockout") locks `student2.test@iba.edu.pk` for 15 minutes. Run `npm run seed` afterwards to unlock it, or untick that folder in the Runner.

Manual test cases and results are in `docs/` (Excel file and PDF).

## Team and roles

| Member                 | Role                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Ali Hamza              | Scrum Master. Backend foundation, Auth API, Events API with conflict check, seed script, deployment, Trello |
| Daniyaal Bokhari       | Backend: Browse, Approvals and Admin APIs, Postman tests for them, Trello                                   |
| Muhammad Umer          | Mobile app (all screens)                                                                                    |
| Muhammad Usman Hussain | Documents and testing                                                                                       |

## Links

- Trello board: `https://trello.com/b/uSWFjHVk/iba-events-hub-sprint-board`
- Documents: the `docs/` folder
- Differences from the SRS and wireframes: `docs/deviations.md`
- API details the contract left open: `docs/api-decisions.md`

## Workflow

- `main` is stable. `develop` is the daily branch.
- Work happens on `feature/<area>-<task>` branches and is merged into `develop` by pull request.
- Commit messages follow `type(area): short message` (feat, fix, docs, test, chore, refactor).
- Secrets (`.env`, connection strings, passwords) are never committed.

## Known issues

- The deployed API runs with email verification switched off (`REQUIRE_EMAIL_VERIFICATION=false`, decision D6), because we have no verified email domain and free hosts restrict outgoing SMTP. The full verification flow works on a local server (`EMAIL_MODE=console`, code printed in the terminal). Logged in `docs/deviations.md`.
- The venue lock that stops two simultaneous bookings is kept in server memory, so on a serverless host it protects each running instance only. Two requests that land on different instances at the same moment could both succeed. The approver's final conflict check before approval reduces the risk. A shared lock moves to Sprint 2.
- Rate limiting covers code resend and failed logins only.
- The Configuration screen (27) was not built; accepted domains and event types are edited through the API (`GET`/`PUT /api/v1/admin/settings`) or the seed script.

## Moves to Sprint 2

Event registration and My Registrations, calendar view, attendance sheet and certificates, notifications (push, email, in-app), favourites and reminders, search and filter with offline cache, profile editing and password reset, drafts and limited editing of approved events, copying an event, alternative slots for conflicts, notification wording screen, and a real email provider with a verified domain.
