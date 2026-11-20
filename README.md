# IBA Events Hub

A mobile app where IBA students discover events of societies, schools and departments, organisers create events, approving authorities approve them, and admins manage users, organisations and venues.

Software Engineering course project, Team 08, IBA Karachi. Currently: Sprint 1.

## Tech stack

- Mobile: React Native with Expo
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas
- Email: Nodemailer (verification codes)

## Sprint 1 features

Sign up, login, roles, browse events (Societies, Schools, Departments), event details, event creation with live venue-conflict check, approval workflow (approve, reject, request changes), admin tools (users, roles, organisations, venues).

## Folder structure

- backend/ the API
- mobile/ the Expo app
- tests/ Postman collection and manual test cases
- docs/ SRS, wireframes, backlog, Sprint 1 documents, deviations.md

## Run the backend

1. cd backend
2. npm install
3. Copy .env.example to .env and fill in the values
4. npm run seed
5. npm run dev

## Run the mobile app

1. cd mobile
2. npm install
3. Set EXPO_PUBLIC_API_URL to the API address
4. npx expo start, then open it in Expo Go

## Test accounts (test data only)

Created by the seed script. See docs for the list. Password comes from SEED_PASSWORD in .env.

## Deployed API

<add address after deployment>

## Team

- Ali Hamza (Scrum Master, backend)
- Danial Bokhari (backend)
- Muhammad Umer (mobile app)
- Muhammad Usman Hussain (documents and testing)

## Links

- Trello: <add link>
- Docs: see the docs/ folder

## Workflow

Branch from develop: feature/<area>-<task>. Open a pull request into develop. A teammate reviews it. Commit format: type(area): message, for example feat(auth): add login endpoint.

## Known issues and Sprint 2

<fill at the end of Sprint 1>
