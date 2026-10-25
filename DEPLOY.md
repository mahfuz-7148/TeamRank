# 🚀 Vercel-এ TeamRank ডিপ্লয়

এই রেপোতে দুটি আলাদা অ্যাপ আছে, তাই **দুটি আলাদা Vercel project** বানাতে হবে:

| Project | Root Directory | ধরন |
| --- | --- | --- |
| `teamrank-api` | `server` | Express (Serverless Function) |
| `teamrank-web` | `client` | Next.js |

> ⚠️ **আগে Mongo Atlas ঠিক করুন:** Vercel-এর IP ডাইনামিক, তাই Atlas → **Network Access**-এ `0.0.0.0/0` (Allow access from anywhere) যোগ করুন। অথবা Atlas-এর dedicated IP/PrivateLink ব্যবহার করুন।

---

## ১. কোড GitHub-এ পুশ করুন

```bash
cd /path/to/TeamRank
git add .
git commit -m "prepare for Vercel deployment"
git remote add origin https://github.com/<you>/teamrank.git
git push -u origin main
```

`.env` / `.env.local` কখনো কমিট হয় না (`.gitignore`-এ আছে)। Vercel-এ Environment Variables দিয়ে সেট করবেন।

---

## ২. Backend ডিপ্লয় (`server/`)

### Dashboard দিয়ে

1. Vercel → **Add New → Project** → রেপো ইমপোর্ট করুন
2. **Root Directory** → `server` সিলেক্ট করুন
3. **Framework Preset** → `Other`
4. **Build Command** / **Output Directory** → খালি রাখুন (ডিফল্ট)
5. **Environment Variables** যোগ করুন:

| Name | Value | নোট |
| --- | --- | --- |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/teamrank` | Atlas connection string |
| `ADMIN_KEY` | একটি শক্তিশালী গোপন কী | admin routes-এর জন্য |
| `CLIENT_URL` | `https://teamrank-web.vercel.app` | client-এর production URL (কমা দিয়ে একাধিক দেওয়া যায়) |
| `PORT` | `5000` | Vercel-এ ব্যবহার হয় না, লোকালের জন্য |

6. **Deploy** চাপুন
7. ডিপ্লয় শেষে টেস্ট করুন:
   ```
   https://<your-api>.vercel.app/api/health
   → {"success":true,"data":{"status":"ok"}}
   ```

### CLI দিয়ে (ঐচ্ছিক)

```bash
cd server
pnpm add -g vercel
vercel            # প্রথমবার project link করবে
vercel --prod
```

CLI-তে environment variables যোগ করুন: `vercel env add MONGO_URI production` ইত্যাদি।

**কীভাবে কাজ করে:** `server/vercel.json` সব রিকোয়েস্ট `api/index.ts`-এ পাঠায়; `createApp()` Express app হ্যান্ডেল করে। `src/config/db.ts`-এ global connection cache আছে, তাই warm container-এ বারবার DB connect হয় না।

> **pnpm:** `server/` ও `client/` দুটোতেই `pnpm-lock.yaml` আছে, তাই Vercel স্বয়ংক্রিয়ভাবে **pnpm** দিয়ে install করবে। `package-lock.json` কখনো কমিট করবেন না।

---

## ৩. Frontend ডিপ্লয় (`client/`)

1. Vercel → **Add New → Project** → একই রেপো
2. **Root Directory** → `client`
3. **Framework Preset** → `Next.js` (অটো ডিটেক্ট হবে)
4. **Environment Variables**:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<your-api>.vercel.app` |

> `NEXT_PUBLIC_*` ভ্যালু **build time**-এ embed হয়। ভ্যালু বদলালে অবশ্যই **Redeploy** করতে হবে।

### 📊 ভিজিট কতবার হয়েছে দেখবেন কোথায়

Vercel **Web Analytics** দিয়ে page view / unique visitor দেখা যায় (Hobby: মাসে ৫০,০০০ event ফ্রি)।

1. কোডে `@vercel/analytics` আগেই যোগ করা আছে (`client/src/app/layout.tsx`-এ `<Analytics />`)
2. Vercel Dashboard → আপনার **frontend** প্রজেক্ট (`team-rank-pearl`) → বাম সাইডবার **Analytics** → **Enable**
3. নতুন কোড **Deploy** করুন (enable করার পর routes তৈরি হয়)
4. কিছু ভিজিটের পর **Analytics** ট্যাবে দেখবেন: **Visitors**, **Page Views**, কোন পেজ বেশি দেখা হচ্ছে, country/device/referrer
5. শুধু **API request** সংখ্যা দেখতে: একই প্রজেক্টের **Observability → Requests / Functions** (এটা ভিজিট নয়, backend call)

> Analytics enable করার আগের ভিজিটগুলো দেখা যাবে না — শুধু enable + deploy-এর পরের ডেটা জমা হবে।

5. **Deploy** চাপুন

---

## ৪. রিয়েল-টাইম নোটিফিকেশন (Socket.IO)

কেউ **"🙋 আমি উত্তর দিতে চাই"** চাপলে সব খোলা ট্যাবে সাথে সাথে টোস্ট নোটিফিকেশন যায় এবং এক্সাম পেজ সঙ্গে সঙ্গে রিফ্রেশ হয়। এটা `server/src/server.ts`-এর Socket.IO সার্ভার করে।

> ⚠️ **Vercel serverless-এ Socket.IO ব্রডকাস্ট কাজ করবে না।**
> Vercel-এর `api/index.ts` শুধু REST চালায়, আর প্রতিটা WebSocket connection আলাদা function instance-এ pin হয় — তাই এক instance থেকে `io.emit()` অন্য ইউজারদের কাছে পৌঁছায় না (এর জন্য Redis adapter লাগে)।

**রিয়েল-টাইম চাইলে backend একটি persistent host-এ নিন** (Render / Railway / Fly.io / VPS):

1. Render → **New → Web Service** → GitHub repo সিলেক্ট
2. **Root Directory** → `server`
3. **Build Command** → `pnpm install && pnpm build`
4. **Start Command** → `pnpm start`
5. Environment: `MONGO_URI`, `ADMIN_KEY`, `CLIENT_URL=https://team-rank-pearl.vercel.app`
6. Deploy → URL পাবেন, যেমন `https://teamrank-api.onrender.com`
7. Vercel frontend-এ `NEXT_PUBLIC_API_URL` = নতুন URL → **Redeploy**
8. (ঐচ্ছিক) `NEXT_PUBLIC_SOCKET_URL` = একই URL, যদি socket আলাদা হোস্টে হয়

Vercel-এ backend রেখে দিলে অ্যাপ ঠিকই চলবে, কিন্তু নোটিফিকেশন **৫ সেকেন্ডের polling-এ** আসবে — সাথে সাথে নয়।

---

## ৫. CORS মিলিয়ে নিন (গুরুত্বপূর্ণ)

Client ডিপ্লয় হওয়ার পর তার URL (যেমন `https://teamrank-web.vercel.app`) **backend-এর `CLIENT_URL`**-এ যোগ করুন, তারপর backend **Redeploy** করুন।

Preview deployment-ও কাজ করাতে চাইলে কমা দিয়ে দিন:

```
CLIENT_URL=https://teamrank-web.vercel.app,https://teamrank-web-git-main-you.vercel.app,http://localhost:3000
```

CORS মিলছে না হলে ব্রাউজারে এমন এরর দেখবেন:
`blocked by CORS policy: No 'Access-Control-Allow-Origin' header`.

---

## ৬. ডিপ্লয়ের পর চেকলিস্ট

- [ ] `GET /api/health` → `200 OK`
- [ ] হোম পেজে ইউজারনেম দিয়ে প্রবেশ
- [ ] `/admin` → admin key দিয়ে পরীক্ষা তৈরি
- [ ] `/award` → Pass ক্লিক → পয়েন্ট +১
- [ ] লিডারবোর্ডে পয়েন্ট দেখা যাচ্ছে
- [ ] `/exam/<id>` → ৫ সেকেন্ডে অটো-রিফ্রেশ
- [ ] দুইটা ব্রাউজার/ট্যাব খুলে একটাতে "উত্তর দিতে চাই" চাপলে অন্যটায় সাথে সাথে টোস্ট আসে

---

## লোকাল ডেভেলপমেন্ট (আগের মতোই)

```bash
# Terminal 1
cd server && pnpm install && pnpm dev     # http://localhost:5000

# Terminal 2
cd client && pnpm install && pnpm dev     # http://localhost:3000
```

`server/.env` এবং `client/.env.local` আগের মতোই ব্যবহার করুন।

---

## সমস্যা হলে

| সমস্যা | সমাধান |
| --- | --- |
| `Database connection failed` (503) | Atlas IP allowlist-এ `0.0.0.0/0`; `MONGO_URI` সঠিক কি না দেখুন; password-এ special character থাকলে URL-encode করুন |
| CORS error | backend-এর `CLIENT_URL`-এ frontend URL যোগ করে redeploy |
| `401 Invalid admin key` | Vercel env-এর `ADMIN_KEY` আর UI-তে দেওয়া কী এক কি না দেখুন |
| Client পুরনো API URL-এ যাচ্ছে | `NEXT_PUBLIC_API_URL` বদলে **Redeploy** করুন (build-time variable) |
| Serverless timeout | Atlas cluster pause হয়ে আছে কি না দেখুন; `server/vercel.json`-এ `maxDuration` ৩০ সেকেন্ড |
| Build-এ `Failed to fetch Hind Siliguri from Google Fonts` | সাময়িক নেটওয়ার্ক সমস্যা — Vercel-এ **Redeploy** দিন; বারবার হলে `client/src/app/layout.tsx` থেকে `next/font/google` সরিয়ে সিস্টেম ফন্ট ব্যবহার করুন |
| `404` on API routes | `server/vercel.json` কমিট হয়েছে কি না নিশ্চিত করুন, Root Directory = `server` |
