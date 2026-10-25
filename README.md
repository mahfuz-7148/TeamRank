# 🏆 TeamRank

A full-stack **team exam, points and leaderboard system**. Admins create exams ("Posts"), team members join with a username, and only the admin can mark who passed. Passing an exam gives **1 point**. A live leaderboard ranks every user.

> **Design note:** total points are **never stored** as a number. They are computed live from the `checkedBy` array across all posts (unwind + group), so every recorded pass counts.

## 🌐 Live

| App | URL |
| --- | --- |
| API (Render, Express + Socket.IO) | https://teamrank.onrender.com |
| Health check | https://teamrank.onrender.com/api/health |
| Frontend (Vercel, Next.js) | https://team-rank-pearl.vercel.app |

## 🔄 Point rules (current)

- The **Pass** button in the admin panel always **adds 1** to a user's count — clicking again adds another (no toggle-off).
- A member can press **"🙋 আমি উত্তর দিতে চাই"** on the exam page. This only adds their **name** to the "wants to answer" list — it never adds a pass or a point. The admin then awards the point separately on `/award` to whoever actually answers correctly.
- Exam detail page shows each user's pass count (e.g. "✅ ৩ বার").
- Exam cards show both **total passes** and **unique users**.
- Leaderboard points = total number of passes recorded for the user across all exams.
- **Real-time:** when anyone presses **"🙋 আমি উত্তর দিতে চাই"**, every open tab gets an instant Socket.IO toast and the exam page refreshes immediately (5s polling remains as fallback).

## Tech stack

| Layer   | Tech                                                                 |
| ------- | -------------------------------------------------------------------- |
| Monorepo | `server/` + `client/`                                               |
| Backend  | Node.js, Express, Mongoose (MongoDB), TypeScript (strict), zod, tsx |
| Frontend | Next.js (App Router), TypeScript (strict), Tailwind CSS             |

## Folder structure

```
TeamRank/
├── render.yaml                   # Render blueprint for the API
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
│       ├── realtime.ts               # Socket.IO singleton + broadcast
│       ├── app.ts                    # Express app (CORS, routes, errors)
│       └── server.ts                 # HTTP + Socket.IO entry point
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
- **pnpm 12+** (`npm install -g pnpm` only if pnpm is missing)
- MongoDB running locally (or a MongoDB Atlas URI)

> This repo uses **pnpm only**. Use `pnpm install` / `pnpm run <script>` — do not generate `package-lock.json`.

### 2. Server

```bash
cd server
pnpm install
cp .env.example .env   # then edit .env
pnpm dev               # http://localhost:5000
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
pnpm install
cp .env.local.example .env.local   # then edit if needed
pnpm dev                           # http://localhost:3000
```

**`client/.env.local` example:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# optional — only if Socket.IO lives on another host
# NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

> Socket.IO runs from `server/src/server.ts`, so the API is hosted on **Render**
> (a persistent Node server). The Next.js frontend stays on Vercel.
> See [DEPLOY.md](./DEPLOY.md).

### Production build

```bash
# server
cd server && pnpm build && pnpm start

# client
cd client && pnpm build && pnpm start
```

### 🧪 Load testing

Concurrency capacity মাপার রেডি স্ক্রিপ্ট: **[loadtest/README.md](./loadtest/README.md)**
(কোনো install লাগে না — `node loadtest/run.mjs`)।

### ☁️ Deploy (Render API + Vercel frontend)

Full step-by-step guide (blueprint, env vars, CORS, Atlas allowlist):
**[DEPLOY.md](./DEPLOY.md)**

Quick summary:

1. Push the repo to GitHub.
2. Render → **New → Blueprint** (uses `render.yaml`) or a Web Service with
   **Root Directory = `server`**, then set `MONGO_URI`, `ADMIN_KEY`, `CLIENT_URL`.
   Build: `pnpm install --frozen-lockfile --prod=false && pnpm build`
   · Start: `node dist/src/server.js` · Health check: `/api/health`.
3. Vercel → frontend project with **Root Directory = `client`**, set
   `NEXT_PUBLIC_API_URL=https://teamrank.onrender.com`, then deploy.
4. Put the Vercel client URL into Render's `CLIENT_URL` and redeploy the API.
5. Verify `https://teamrank.onrender.com/api/health` → `200`.

> Render-এ API চলার কারণে Socket.IO রিয়েল-টাইম নোটিফিকেশন কাজ করে।

## API

| Method | Route                 | Auth        | Description                                    |
| ------ | --------------------- | ----------- | ---------------------------------------------- |
| POST   | `/api/users`          | —           | Create user by username, or return existing    |
| GET    | `/api/users`          | —           | All users sorted by username                   |
| POST   | `/api/posts`          | admin only  | Create an exam                                 |
| GET    | `/api/posts`          | —           | All exams, newest first                        |
| GET    | `/api/posts/:id`      | —           | One exam, `checkedBy` populated (username only)|
| POST   | `/api/posts/:id/respond` | —        | User raises hand: name only, **no points** (`$addToSet`) |
| POST   | `/api/posts/:id/award`| admin only  | Add one pass (`$push`; repeated calls add up)   |
| GET    | `/api/leaderboard`    | —           | Passes counted per user (unwind + group), ranked |

Admin routes require the header `x-admin-key: <ADMIN_KEY>`. Invalid ObjectIds return `400`; validation errors (zod) return `400` with per-field messages; duplicate usernames are deduplicated (the existing user is returned).

## Flow

1. **Join** — a team member opens the app, enters a username once. The user is created in MongoDB and `{ id, username }` is saved in `localStorage`, so they're never asked again.
2. **Exams** — the home page lists all exams (newest first) with a pass count, plus the live leaderboard.
3. **Exam detail** — clicking an exam shows its description, who wants to answer, and everyone who passed it. A logged-in member sees an **"🙋 আমি উত্তর দিতে চাই"** button: one click adds only their name to the responder list (no pass, no points). The admin later awards points to whoever answers correctly. Every press is pushed over **Socket.IO** to all open tabs as a notification, and the exam page refreshes instantly (5s polling is the fallback).
4. **Admin creates exams** — on `/admin`, the admin enters their key (kept **only** in component state, never persisted), a title and optional content.
5. **Admin awards points** — on `/award`, the admin picks an exam and clicks **Pass** per user. Every click records one more pass (`$push`), so a student who answered 3 questions correctly can be given 3 points. Each user's running count appears as a badge.
6. **Leaderboard** — points are computed live by unwinding `checkedBy` across posts, grouping per user and counting entries, then sorted by points (desc) and username (asc). Nothing is stored as a total.

## Security notes

- CORS is restricted to `CLIENT_URL`.
- Admin key is verified server-side on every admin route; it is never stored in `localStorage` or cookies.
- All user text is rendered as normal React text (never `dangerouslySetInnerHTML`).
