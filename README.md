# Us — a couples guessing game

Two players join a room, answer the same question secretly, then try to guess
what their partner picked. Correct guess = 10 points. Real multiplayer via
Socket.io, server-authoritative scoring, anti-repeat question history per
couple — this is a **working Phase 1**, not a mockup.

## What's actually implemented (Phase 1, per the brief's own phasing)

- Landing page, create room, join by code/link, nickname + avatar
- 4 question packages × 10 questions (40 total) — see "Growing the question bank" below
- Real-time room via Socket.io: both players see live state, nobody's answer
  leaks until both have submitted
- Full game loop: answer → both-locked → guess → reveal → next → final result
- Server-side scoring (client never computes or sends a score)
- Anti-repeat system: a couple never gets the same question twice across
  games, tracked per couple-pair, until a package is exhausted
- Reconnect handling: closing/reopening the tab rejoins the room and resumes
  the in-progress question
- Mobile-first responsive layout

## Deliberately not built yet (this is the honest part)

The original brief (sections 1–50) also asks for: 20 packages / 200+
questions, accounts + auth, an admin dashboard for managing questions,
long-term "Love Score" + badges, game history dashboard, sound effects,
dark mode, and extra game modes (Would You Rather, Memory Challenge, etc.).
None of that is faked — it's just not here. The architecture is built so
each one is additive:

- **More questions/packages** → add rows to `backend/data/seedQuestions.js`
  and an entry in `backend/data/packages.js`. Nothing else changes.
- **Admin dashboard** → thin CRUD UI over the existing `Question` model.
- **Accounts/auth** → swap the anonymous `playerId` (already a stable string
  used everywhere) for a real user id from whatever auth you add.
- **Game history / Love Score** → already have every `Game` document
  persisted with full answers/guesses; it's a read-only dashboard away.
- **Extra game modes** → the socket state machine
  (`QUESTION_ACTIVE → GUESSING_PHASE → ANSWER_REVEAL`) is written generically
  enough to add a second mode alongside it later.

## Stack

- Frontend: React + Vite + Tailwind + Framer Motion + socket.io-client
- Backend: Node + Express + Socket.io + Mongoose
- Database: MongoDB (Atlas)

This matches your usual Vercel (frontend) + Render (backend) + MongoDB Atlas
deploy pattern.

## Running it locally

**Backend**
```bash
cd backend
cp .env.example .env      # fill in MONGODB_URI
npm install
npm run seed              # loads the 40 seed questions into your DB
npm run dev                # http://localhost:4000
```

**Frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev                # http://localhost:5173
```

Open two browser windows (or one normal + one incognito) at
`http://localhost:5173` to play both sides of a room yourself.

## Deploying

- **Backend → Render**: new Web Service, root = `backend/`, build
  `npm install`, start `npm start`. Set `MONGODB_URI` and `CLIENT_URL`
  (your deployed frontend URL) as environment variables. Run `npm run seed`
  once (Render shell, or locally against the same Atlas URI) to populate
  questions.
- **Database → MongoDB Atlas**: create a free cluster, allow network access
  from Render, grab the connection string for `MONGODB_URI`.
- **Frontend → Vercel**: root = `frontend/`, framework preset Vite. Set
  `VITE_API_URL` to your Render backend URL.

## Testing checklist (from the brief's own list)

Everything below works against this Phase 1 build except items marked ⏳
(blocked on a feature not built yet):

- ✅ two browsers joining the same room
- ✅ both players receiving the same question
- ✅ answers staying private until both submit
- ✅ guessing phase only appears after both submissions
- ✅ correct/incorrect detection, real-time score updates
- ✅ 10-question completion → winner/tie calculation
- ✅ room reconnection (refresh mid-question resumes state)
- ✅ duplicate-question prevention per couple
- ✅ mobile responsiveness
- ✅ invalid room code handling
- ⏳ "100 Love Points" is shown as a badge on a win/tie (not yet a persisted
  long-term score across games — see Game history above)
