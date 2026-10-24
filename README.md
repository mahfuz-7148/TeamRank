# 🏆 TeamRank

A full-stack **team exam, points and leaderboard system**. Admins create exams ("Posts"), team members join with a username, and only the admin can mark who passed. Passing an exam gives **1 point**. A live leaderboard ranks every user.

> **Design note:** total points are **never stored** as a number. They are computed live from how many exams contain the user in their `checkedBy` array (MongoDB `$lookup` + `$size`), so the leaderboard is always consistent.

## Tech stack

| Layer   | Tech                                                                 |
| ------- | -------------------------------------------------------------------- |
| Monorepo | `server/` + `client/`                                               |
| Backend  | Node.js, Express, Mongoose (MongoDB), TypeScript (strict), zod, tsx |
| Frontend | Next.js (App Router), TypeScript (strict), Tailwind CSS             |

## Folder structure

```
TeamRank/
├── server/
│   └── src/
│       ├── config/db.ts              # MongoDB connection
│       ├── models/
│       │   ├── User.ts               # username, createdAt
│       │   └── Post.ts               # title, content, checkedBy[]
│       ├── middleware/
│       │   ├── adminOnly.ts          # x-admin-key check
│       │   ├── validateObjectId.ts   # invalid ObjectId guard + HttpError
│       │   └── errorHandler.ts       # central error handling
│       ├── controllers/
│       │   ├── userController.ts
│       │   ├── postController.ts
│       │   └── leaderboardController.ts
│       ├── routes/
│       │   ├── userRoutes.ts
│       │   ├── postRoutes.ts
│       │   └── leaderboardRoutes.ts
│       ├── types/                    # shared types + zod schemas
│       ├── app.ts                    # Express app (CORS, routes, errors)
│       └── server.ts                 # entry point
└── client/
    └── src/
        ├── app/
        │   ├── page.tsx              # username form / exams + leaderboard
        │   ├── exam/[id]/page.tsx    # exam detail, auto-refresh 5s
        │   ├── admin/page.tsx        # create exam (admin)
        │   └── award/page.tsx        # award/toggle points (admin)
        ├── components/
        │   ├── ExamCard.tsx
        │   ├── Leaderboard.tsx
        │   ├── PassedList.tsx
        │   └── UsernameForm.tsx
        ├── lib/
        │   ├── api.ts                # typed fetch wrapper
        │   └── user.ts               # localStorage helpers (SSR-safe)
        └── types/index.ts            # User, Exam, LeaderboardEntry
```

## Setup

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 2. Server

```bash
cd server
npm install
cp .env.example .env   # then edit .env
npm run dev            # http://localhost:5000
```

**`server/.env` example:**

```env
MONGO_URI=mongodb://localhost:27017/teamrank
ADMIN_KEY=change-me-to-a-strong-secret
PORT=5000
CLIENT_URL=http://localhost:3000
```

- `CLIENT_URL` — the **only** origin allowed by CORS.
- `ADMIN_KEY` — sent by admin pages via the `x-admin-key` header.

### 3. Client

```bash
cd client
npm install
cp .env.local.example .env.local   # then edit if needed
npm run dev                        # http://localhost:3000
```

**`client/.env.local` example:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Production build

```bash
# server
cd server && npm run build && npm start

# client
cd client && npm run build && npm start
```

## API

| Method | Route                 | Auth        | Description                                    |
| ------ | --------------------- | ----------- | ---------------------------------------------- |
| POST   | `/api/users`          | —           | Create user by username, or return existing    |
| GET    | `/api/users`          | —           | All users sorted by username                   |
| POST   | `/api/posts`          | admin only  | Create an exam                                 |
| GET    | `/api/posts`          | —           | All exams, newest first                        |
| GET    | `/api/posts/:id`      | —           | One exam, `checkedBy` populated (username only)|
| POST   | `/api/posts/:id/award`| admin only  | Toggle user in `checkedBy` (`$addToSet`/`$pull`)|
| GET    | `/api/leaderboard`    | —           | Aggregated points (`$lookup` + `$size`), ranked|

Admin routes require the header `x-admin-key: <ADMIN_KEY>`. Invalid ObjectIds return `400`; validation errors (zod) return `400` with per-field messages; duplicate usernames are deduplicated (the existing user is returned).

## Flow

1. **Join** — a team member opens the app, enters a username once. The user is created in MongoDB and `{ id, username }` is saved in `localStorage`, so they're never asked again.
2. **Exams** — the home page lists all exams (newest first) with a pass count, plus the live leaderboard.
3. **Exam detail** — clicking an exam shows its description and everyone who passed it. The list auto-refreshes every 5 seconds.
4. **Admin creates exams** — on `/admin`, the admin enters their key (kept **only** in component state, never persisted), a title and optional content.
5. **Admin awards points** — on `/award`, the admin picks an exam and toggles **Pass / Passed** per user. The server uses `$addToSet` / `$pull`, so a user can never be counted twice.
6. **Leaderboard** — points are computed on the fly via a `$lookup` from `users` to `posts.checkedBy` with `$size`, sorted by points (desc) then username (asc).

## Security notes

- CORS is restricted to `CLIENT_URL`.
- Admin key is verified server-side on every admin route; it is never stored in `localStorage` or cookies.
- All user text is rendered as normal React text (never `dangerouslySetInnerHTML`).
