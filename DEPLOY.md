# 🚀 TeamRank ডিপ্লয় (Render API + Vercel frontend)

এই রেপোতে দুটি আলাদা অ্যাপ আছে:

| App | কোথায় | Root Directory | ধরন |
| --- | --- | --- | --- |
| API | **Render** | `server` | Express + Socket.IO (long-running) |
| Web | **Vercel** | `client` | Next.js |

> ✅ API এখন Render-এ চলবে, তাই **Socket.IO রিয়েল-টাইম নোটিফিকেশন** কাজ করবে।
> ⚠️ পুরোনো Vercel backend project (`server-three-jade-96`) আর ব্যবহার হবে না — মাইগ্রেশনের পরে ডিলিট করে দিন।

> ⚠️ **Mongo Atlas:** Render-এর IP ডাইনামিক, তাই Atlas → **Network Access**-এ `0.0.0.0/0`
> (Allow access from anywhere) যোগ করুন। অথবা dedicated IP/PrivateLink ব্যবহার করুন।

---

## ১. কোড GitHub-এ পুশ করুন

```bash
cd /path/to/TeamRank
git add .
git commit -m "deploy API on Render"
git push origin main
```

`.env` / `.env.local` কখনো কমিট হয় না (`.gitignore`-এ আছে)। Environment variables
Render ও Vercel-এর dashboard-এ সেট করবেন।

---

## ২. Render-এ API ডিপ্লয়

### উপায় A — Blueprint (`render.yaml` আগেই আছে)

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. GitHub repo সিলেক্ট করুন → Render `render.yaml` পড়ে সার্ভিস তৈরি করবে
3. `MONGO_URI`, `ADMIN_KEY`, `CLIENT_URL` — তিনটার মান দিন
4. **Apply / Deploy** চাপুন

### উপায় B — ম্যানুয়াল Web Service

1. Render → **New → Web Service** → repo সিলেক্ট
2. **Root Directory** → `server`
3. **Runtime** → `Node`
4. **Region** → `Singapore` (বাংলাদেশের জন্য সবচেয়ে কাছাকাছি)
5. **Build Command**:
   ```bash
   pnpm install --frozen-lockfile --prod=false && pnpm build
   ```
6. **Start Command**:
   ```bash
   node dist/src/server.js
   ```

> ⚠️ Build Command-এ `corepack enable` **দেবেন না** — Render-এ `/usr/bin/pnpm`
> read-only, তাই `EROFS: read-only file system, unlink '/usr/bin/pnpm'` এরর হয়।
> Render-এ pnpm আগে থেকেই ইনস্টল থাকে।
7. **Health Check Path** → `/api/health`
8. **Environment Variables**:

| Name | Value | নোট |
| --- | --- | --- |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/teamrank` | Atlas connection string |
| `ADMIN_KEY` | শক্তিশালী গোপন কী | admin routes-এর জন্য |
| `CLIENT_URL` | `https://team-rank-pearl.vercel.app` | frontend origin (কমা দিয়ে একাধিক) |
| `NODE_VERSION` | `22` | Blueprint-এ সেট করা আছে |

> `PORT` Render নিজেই দেয় — ম্যানুয়ালি দিতে হবে না।

### ডিপ্লয় verification

```
https://<your-api>.onrender.com/api/health
→ {"success":true,"data":{"status":"ok"}}
```

**কীভাবে কাজ করে:** `server/src/server.ts` HTTP সার্ভার বানিয়ে তাতে Express ও
Socket.IO attach করে, তারপর Render-এর দেওয়া `PORT`-এ listen করে। `pnpm build`
TypeScript কম্পাইল করে `dist/src/server.js` তৈরি করে, `pnpm start` সেটাই চালায়।

> **Free tier:** Render free service ১৫ মিনিট নিষ্ক্রিয় থাকলে ঘুমিয়ে পড়ে; প্রথম
> রিকোয়েস্টে ~৩০–৬০ সেকেন্ড লাগতে পারে। Socket.IO ক্লায়েন্ট নিজেই reconnect করে।

---

## ৩. Frontend (Vercel) নতুন API-তে পয়েন্ট করুন

1. Vercel → **frontend** প্রজেক্ট (`team-rank-pearl`) → **Settings → Environment Variables**
2. `NEXT_PUBLIC_API_URL` = `https://<your-api>.onrender.com`
3. (ঐচ্ছিক) `NEXT_PUBLIC_SOCKET_URL` — শুধু socket আলাদা হোস্টে হলে
4. **Deployments → Redeploy** (⚠️ `NEXT_PUBLIC_*` build-time-এ embed হয়)

frontend URL: `https://team-rank-pearl.vercel.app`

### 📊 ভিজিট কতবার হয়েছে দেখবেন কোথায়

Vercel **Web Analytics** দিয়ে page view / unique visitor দেখা যায় (Hobby: মাসে ৫০,০০০ event ফ্রি)।

1. কোডে `@vercel/analytics` আগেই যোগ করা আছে (`client/src/app/layout.tsx`-এ `<Analytics />`)
2. Vercel Dashboard → frontend প্রজেক্ট → বাম সাইডবার **Analytics** → **Enable**
3. **Enable করার পর নতুন deployment দিন** (তবেই `/_vercel/insights/*` route তৈরি হয়)
4. কিছু ভিজিটের পর দেখবেন: **Visitors**, **Page Views**, top pages, country/device/referrer

> চেক: `https://team-rank-pearl.vercel.app/_vercel/insights/script.js` → `200` হলে Analytics চালু।
> এনাবলের আগের ভিজিট দেখা যাবে না।

---

## ৪. CORS মিলিয়ে নিন (গুরুত্বপূর্ণ)

Render-এর `CLIENT_URL`-এ **frontend-এর exact URL** থাকতে হবে (scheme + host, trailing slash ছাড়া):

```
CLIENT_URL=https://team-rank-pearl.vercel.app
```

Preview deployment-ও চাইলে কমা দিয়ে:

```
CLIENT_URL=https://team-rank-pearl.vercel.app,https://team-rank-pearl-git-main-you.vercel.app,http://localhost:3000,http://localhost:3005
```

মান বদলালে Render **Manual Deploy → Clear build cache & deploy** দিন।

CORS মিলছে না হলে ব্রাউজারে দেখবেন:
`blocked by CORS policy: No 'Access-Control-Allow-Origin' header`.

---

## ৫. রিয়েল-টাইম নোটিফিকেশন টেস্ট

1. একই এক্সাম পেজ দুটি ব্রাউজার/ট্যাবে খুলুন
2. একটাতে **"🙋 আমি উত্তর দিতে চাই"** চাপুন
3. অন্যটায় **সাথে সাথে** টোস্ট আসবে → "… উত্তর দিতে চেয়েছে"
4. এক্সাম পেজও সঙ্গে সঙ্গে রিফ্রেশ হবে (৫ সেকেন্ডের polling শুধু ব্যাকআপ)

Socket সংযোগ চেক করতে DevTools → Network → `WS` ফিল্টার → `socket.io` → `101 Switching Protocols`.

---

## ৬. ডিপ্লয়ের পর চেকলিস্ট

- [ ] `GET https://<api>.onrender.com/api/health` → `200 OK`
- [ ] Vercel frontend `NEXT_PUBLIC_API_URL` = Render URL
- [ ] হোম পেজে ইউজারনেম দিয়ে প্রবেশ
- [ ] `/admin` → admin key দিয়ে পরীক্ষা তৈরি
- [ ] `/award` → Pass ক্লিক → পয়েন্ট +১
- [ ] লিডারবোর্ডে পয়েন্ট দেখা যাচ্ছে
- [ ] এক্সাম পেজে পাস-লিস্ট লোড হচ্ছে
- [ ] দুই ট্যাবে "উত্তর দিতে চাই" → সাথে সাথে টোস্ট
- [ ] পুরোনো Vercel backend project ডিলিট করা হয়েছে

---

## লোকাল ডেভেলপমেন্ট

```bash
# Terminal 1 — API + Socket.IO
cd server && pnpm install && pnpm dev     # http://localhost:5000

# Terminal 2 — Next.js
cd client && pnpm install && pnpm dev     # http://localhost:3000
```

`server/.env` (MONGO_URI, ADMIN_KEY, CLIENT_URL=http://localhost:3000,http://localhost:3005)
এবং `client/.env.local` (NEXT_PUBLIC_API_URL=http://localhost:5000) ব্যবহার করুন।

---

## সমস্যা হলে

| সমস্যা | সমাধান |
| --- | --- |
| `EROFS: read-only file system, unlink '/usr/bin/pnpm'` | Build Command থেকে `corepack enable &&` **সরান**; Render-এর pnpm ব্যবহার করুন |
| Build fail: `pnpm: not found` | Build Command-এ `corepack pnpm install ...` ব্যবহার করুন (enable নয়), অথবা `NODE_VERSION=22` দিন |
| Build fail: `tsc not found` | `pnpm install --frozen-lockfile --prod=false` ব্যবহার করুন (devDependencies দরকার) |
| `Database connection failed` | Atlas IP allowlist-এ `0.0.0.0/0`; `MONGO_URI` সঠিক; password special character হলে URL-encode |
| CORS error | Render `CLIENT_URL`-এ frontend URL দিন → redeploy |
| `401 Invalid admin key` | Render env-এর `ADMIN_KEY` আর UI-তে দেওয়া কী এক কি না দেখুন |
| Client পুরনো API URL-এ যাচ্ছে | `NEXT_PUBLIC_API_URL` বদলে Vercel-এ **Redeploy** |
| Socket connect হচ্ছে না | `CLIENT_URL` সঠিক কি না; Render logs-এ `[socket]` লাইন দেখুন; free tier ঘুম থেকে জাগতে সময় লাগে |
| প্রথম রিকোয়েস্ট ৩০–৬০s | Render free tier cold start — স্বাভাবিক; Pro নিলে এড়ানো যায় |
| `Failed to fetch Hind Siliguri from Google Fonts` | সাময়িক নেটওয়ার্ক সমস্যা — আবার deploy দিন |
