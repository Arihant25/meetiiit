# MeetIIIT

MeetIIIT is a minimal anonymous meetup app for IIIT-H students.

Users create profiles with:
- username
- up to 5 interest tags
- a "What I Wanna Say" note, which can be as long as they want

Students can discover others through a notes-style feed and start anonymous DMs.

## Stack

- Next.js (App Router)
- MongoDB (via Mongoose)

## Features

- Feed with filtering by tags and New/Old sorting
- Anonymous public profiles
- 1:1 anonymous chat (DM)
- Manual verification flow for new users
- Admin dashboard for approvals and moderation
- Settings: change password, delete account

## Verification Flow

During signup, users provide name, batch, username, and password.

Name and batch are used only for verification and are not shown publicly.

A 6-digit OTP is generated at signup. Users must share that OTP with OSDG to be approved.

Contact:
- Instagram: https://www.instagram.com/osdg.iiith/
- Email: osdg@students.iiit.ac.in

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=meetiiit
```

`MONGODB_DB` is optional (defaults to `meetiiit`).

3. Start dev server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Admin Bootstrap

On server startup, the app ensures an admin account exists:
- username: `osdg`
- password: randomly generated and printed in backend logs

Keep that password secure and rotate it after first login.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run ESLint

<a href="https://www.flaticon.com/free-icons/friends" title="friends icons">Friends icon created by Freepik - Flaticon</a>