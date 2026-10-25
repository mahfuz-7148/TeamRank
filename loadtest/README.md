# 🧪 TeamRank Load Test

কতজন একসাথে ব্যবহার করতে পারবে তা মাপার জন্য ছোট, ডিপেন্ডেন্সি-ফ্রি লোড টেস্টার।
Node 18+ আর `fetch` ব্যবহার করে — আলাদা install লাগে না।

## দ্রুত রিড-অনলি টেস্ট (নিরাপদ)

`GET /api/posts`, `GET /api/posts/:id`, `GET /api/leaderboard` — কোনো ডেটা বদলায় না।

```bash
# লোকাল সার্ভার (pnpm dev চালু থাকতে হবে)
BASE_URL=http://localhost:5000 \
EXAM_ID=<exam-id> \
CONCURRENCY=50 DURATION=30 \
node loadtest/run.mjs
```

```bash
# ডিপ্লয় করা API
BASE_URL=https://teamrank.onrender.com \
EXAM_ID=6add051a2ec99067db70a9ba \
CONCURRENCY=50 DURATION=30 \
node loadtest/run.mjs
```

## রাইট টেস্ট (নাম যোগ করা)

⚠️ লোকাল ও ডিপ্লয়ড সার্ভার **একই Atlas DB** ব্যবহার করে। তাই টেস্টের আগে আলাদা
ইউজার + এক্সাম বানান, শেষে মুছে ফেলুন। হালকা লোড (১০–২০ worker) দিয়ে শুরু করুন।

```bash
ADMIN_KEY=admin1
BASE_URL=http://localhost:5000

# ১) টেস্ট ইউজার
UID=$(curl -s -X POST "$BASE_URL/api/users" -H 'Content-Type: application/json' \
  -d '{"username":"loadtest_user"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.id')

# ২) টেস্ট এক্সাম
EID=$(curl -s -X POST "$BASE_URL/api/posts" -H 'Content-Type: application/json' \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"title":"loadtest exam","content":"ignore"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.id')

# ৩) ২০% রিকোয়েস্ট নাম-রেজিস্ট্রেশন (বাকি ৮০% পড়া)
BASE_URL=$BASE_URL EXAM_ID=$EID USER_ID=$UID \
CONCURRENCY=20 DURATION=30 WRITE_PERCENT=20 \
node loadtest/run.mjs

# ৪) ক্লিনআপ
curl -s -X DELETE "$BASE_URL/api/posts/$EID" -H "x-admin-key: $ADMIN_KEY"
curl -s -X DELETE "$BASE_URL/api/users/$UID" -H "x-admin-key: $ADMIN_KEY"
```

## AS-IF-REAL-USER টেস্ট (think time)

প্রতি worker একটানা hammer না করে ১ সেকেন্ড থামবে — বাস্তব ইউজারের মতো:

```bash
BASE_URL=https://teamrank.onrender.com \
EXAM_ID=<exam-id> \
CONCURRENCY=100 DURATION=60 THINK_MS=1000 \
node loadtest/run.mjs
```

## ধাপে ধাপে চাপ বাড়ান

একসাথে লাফ দেবেন না। প্রতিটা ধাপে p95 ও error rate দেখুন:

| ধাপ | CONCURRENCY | লক্ষ্য |
| --- | --- | --- |
| 1 | 10 | বেসলাইন, সব 200 |
| 2 | 25 | p95 < 300ms |
| 3 | 50 | p95 < 500ms, error < 1% |
| 4 | 100 | p95 < 800ms |
| 5 | 200 | কোথায় ভাঙে সেটা খুঁজুন |
| 6 | 500 | চূড়ান্ত সীমা (সাবধান) |

**পাসের মান:** `success ≥ 99%` এবং (লোকাল/একই রিজিওনে) `p95 < 500ms`।
এরপরও ভালো পারফরম্যান্স থাকলে পরের ধাপে যান। যেখানে error বাড়ে বা p95 লাফিয়ে
বাড়ে — সেটাই আপনার বর্তমান ক্যাপাসিটি।

> 🌍 দূরের রিজিওন থেকে টেস্ট করলে p50-ই ৬০০ms+ হতে পারে (Bangladesh → Render region
> → Atlas)। এটা কোডের সমস্যা নয়, নেটওয়ার্ক RTT। তাই remote টেস্টে p95-এর
> সাথে p50-ও দেখুন — p50 স্থির থাকলে মানে অ্যাপ স্কেল করছে।

## ফলাফল কীভাবে পড়বেন

- **req/s** — সার্ভার প্রতি সেকেন্ডে কত রিকোয়েস্ট নিচ্ছে
- **p50** — অর্ধেক ইউজারের অভিজ্ঞতা
- **p95** — ৯৫% ইউজারের চেয়ে দ্রুত (এটাই মূল মেট্রিক)
- **p99 / max** — সবচেয়ে খারাপ কেস (cold start ধরা পড়ে)
- **concurrency** — একসাথে কতগুলো রিকোয়েস্ট ইন-ফ্লাইট

> "একসাথে কতজন ইউজার" = `req/s ÷ (1 ÷ think time)`।
> যেমন ৫০ req/s আর প্রতি ইউজার ৩ সেকেন্ডে ১ রিকোয়েস্ট → ~১৫০ জন।

## কোথায় bottleneck হবে

1. **MongoDB Atlas** (সবচেয়ে বড়) — free/shared tier-এ CPU, connections (M0 ≈ ৫০০), slow queries
2. **Render free tier** — ১৫ মিনিট নিষ্ক্রিয় থাকলে sleep, cold start ~৩০–৬০s
3. **DB connection** — প্রতিটা warm function instance একটা connection রাখে
4. **Write contention** — একই `Post` ডকুমেন্টে অনেক `$addToSet`/`$push` একসাথে

## চাপ দেওয়ার সময় কী মনিটর করবেন

- **Render** → Logs / Metrics: CPU, memory, response time, restarts
- **Socket.IO** → Render logs-এ `[socket] connected` লাইন
- **Atlas** → Metrics: Connections, CPU, Opcounters (query/insert/update), Disk IOPS
- **স্ক্রিপ্টের** p95/p99 আর status code (429/500 এলে থামুন)

## 📈 পুরোনো Vercel ডিপ্লয়ে মাপা ফল (তুলনার জন্য)

| কোথায় | Worker | Think | req/s | p50 | p95 | Success |
| --- | --- | --- | --- | --- | --- | --- |
| Vercel (পুরোনো) | 10 | 0 | 15.4 | 636ms | 1281ms | 100% |
| Vercel (পুরোনো) | 30 | 0 | 30.6 | 673ms | 2609ms | 100% |
| Vercel (পুরোনো) | 50 | 1s | 26.5 | 642ms | 1650ms | 100% |
| লোকাল API | 30 | 0 | 50.9 | 659ms | 862ms | 100% |

**ব্যাখ্যা:**

- p50 প্রায় একই (~650ms) → মূল delay **Bangladesh ↔ Atlas RTT**, কোড নয়
- লোকাল সার্ভার ৫১ req/s, Vercel ৩০ req/s — serverless-এ concurrency overhead ছিল
- এখন API Render-এ, তাই নতুন করে মাপলে সংখ্যা বদলাবে
- কোনো 5xx/429 নেই — কিন্তু ৩০ worker-এ p95 ২.৬s, তাই হঠাৎ burst-এ ধীর লাগবে

**বাস্তব ক্যাপাসিটি (৫s polling ধরে):**

- এক্সাম পেজ খোলা ১ জন = ৫ সেকেন্ডে ১ রিকোয়েস্ট = 0.2 req/s
- ১০০ জন একসাথে পেজ খোলা = ২০ req/s → পরীক্ষিত ২৬–৩০ req/s-এর মধ্যে ✅
- ২০০ জন = ৪০ req/s → p95 আরও বাড়বে, তখন polling ১০–১৫s করা বা DB/region আপগ্রেড দরকার

**আরও স্কেল করতে:** polling interval বাড়ানো, Render region + Atlas region
একই জায়গায় রাখা (Render Singapore + Atlas Mumbai/Singapore), leaderboard-এ ছোট cache,
আর Atlas free tier থেকে paid tier-এ যাওয়া।

## রিয়েল-লাইফ চেক

অ্যাপের জন্য ৫–১০ জনকে একসাথে একই এক্সাম পেজ খুলে
"🙋 আমি উত্তর দিতে চাই" চাপতে বলুন। সবার নাম ২–৫ সেকেন্ডের মধ্যে দেখা গেলে
বাস্তব ব্যবহারে ঠিক আছে — তারপরই শুধু উপরের লোড টেস্ট দিয়ে সীমা বের করুন।
