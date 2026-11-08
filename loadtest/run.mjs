#!/usr/bin/env node
/**
 * TeamRank load tester — no dependencies, Node 18+ (uses global fetch).
 *
 * Env:
 *   BASE_URL        API base            (default http://localhost:5000)
 *   CONCURRENCY     parallel workers    (default 50)
 *   DURATION        seconds             (default 30)
 *   THINK_MS        pause per worker    (default 0; e.g. 1000 = realistic user)
 *   EXAM_ID         exam id for detail / write requests
 *   AUTH_USERNAME   account username    (required — APIs need a session)
 *   AUTH_PASSWORD   account password    (required)
 *   WRITE_PERCENT   % of requests that POST /respond (default 0)
 *
 * Example:
 *   BASE_URL=https://teamrank.onrender.com \
 *   EXAM_ID=6add051a2ec99067db70a9ba \
 *   AUTH_USERNAME=demo AUTH_PASSWORD=secretpass123 \
 *   CONCURRENCY=50 DURATION=30 node loadtest/run.mjs
 */

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:5000").replace(
  /\/$/,
  ""
);
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 50));
const DURATION = Math.max(1, Number(process.env.DURATION ?? 30));
const THINK_MS = Math.max(0, Number(process.env.THINK_MS ?? 0));
const EXAM_ID = process.env.EXAM_ID ?? "";
const AUTH_USERNAME = process.env.AUTH_USERNAME ?? "";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? "";
const WRITE_PERCENT = Math.min(100, Math.max(0, Number(process.env.WRITE_PERCENT ?? 0)));

const REQUEST_TIMEOUT_MS = 15000;

async function loginAndGetCookie() {
  if (!AUTH_USERNAME || !AUTH_PASSWORD) {
    console.error(
      "❌ AUTH_USERNAME and AUTH_PASSWORD are required (all APIs need a session)."
    );
    process.exit(1);
  }
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: AUTH_USERNAME,
      password: AUTH_PASSWORD,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`❌ Login failed (${res.status}): ${body}`);
    process.exit(1);
  }
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") ?? ""].filter(Boolean);
  const cookie = setCookies
    .map((value) => value.split(";")[0])
    .filter(Boolean)
    .join("; ");
  if (!cookie) {
    console.error("❌ Login succeeded but no auth cookie was returned.");
    process.exit(1);
  }
  return cookie;
}

const authCookie = await loginAndGetCookie();

const latencies = [];
const statusCounts = new Map();
let successes = 0;
let failures = 0;
let networkErrors = 0;

const readPaths = ["/api/posts", "/api/leaderboard"];
if (EXAM_ID) readPaths.push(`/api/posts/${EXAM_ID}`);

const writeEnabled = WRITE_PERCENT > 0 && EXAM_ID.length > 0;

function pickRequest() {
  if (writeEnabled && Math.random() * 100 < WRITE_PERCENT) {
    return {
      method: "POST",
      path: `/api/posts/${EXAM_ID}/respond`,
      body: null,
    };
  }
  const path = readPaths[Math.floor(Math.random() * readPaths.length)];
  return { method: "GET", path };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function worker(deadline) {
  while (Date.now() < deadline) {
    const req = pickRequest();
    const started = performance.now();
    try {
      const res = await fetch(`${BASE_URL}${req.path}`, {
        method: req.method,
        headers: {
          Cookie: authCookie,
          ...(req.body ? { "Content-Type": "application/json" } : {}),
        },
        body: req.body ? JSON.stringify(req.body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      await res.arrayBuffer();
      const elapsed = performance.now() - started;
      latencies.push(elapsed);
      statusCounts.set(res.status, (statusCounts.get(res.status) ?? 0) + 1);
      if (res.ok) successes += 1;
      else failures += 1;
    } catch {
      networkErrors += 1;
      failures += 1;
      latencies.push(performance.now() - started);
    }
    if (THINK_MS > 0) await sleep(THINK_MS);
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

console.log(`\n🔫 TeamRank load test`);
console.log(`   target      : ${BASE_URL}`);
console.log(`   concurrency : ${CONCURRENCY} workers`);
console.log(`   duration    : ${DURATION}s`);
console.log(`   think time  : ${THINK_MS}ms`);
console.log(`   auth user   : ${AUTH_USERNAME}`);
console.log(
  `   writes      : ${writeEnabled ? `${WRITE_PERCENT}% POST /respond` : "off (read-only)"}`
);
console.log(writeEnabled ? "" : "   (set EXAM_ID + WRITE_PERCENT=20 for writes)\n");

const deadline = Date.now() + DURATION * 1000;
const startedAt = performance.now();
await Promise.all(
  Array.from({ length: CONCURRENCY }, () => worker(deadline))
);
const totalSeconds = (performance.now() - startedAt) / 1000;

const sorted = [...latencies].sort((a, b) => a - b);
const total = latencies.length;
const rps = total / totalSeconds;
const successRate = total === 0 ? 0 : (successes / total) * 100;
const avg = total === 0 ? 0 : sorted.reduce((a, b) => a + b, 0) / total;

console.log(`\n📊 Result`);
console.log(`   requests    : ${total} in ${totalSeconds.toFixed(1)}s`);
console.log(`   throughput  : ${rps.toFixed(1)} req/s`);
console.log(`   success     : ${successes} (${successRate.toFixed(2)}%)`);
console.log(`   failed      : ${failures} (HTTP errors: ${failures - networkErrors}, network: ${networkErrors})`);
console.log(`   latency avg : ${avg.toFixed(1)} ms`);
console.log(`   latency p50 : ${percentile(sorted, 50).toFixed(1)} ms`);
console.log(`   latency p95 : ${percentile(sorted, 95).toFixed(1)} ms`);
console.log(`   latency p99 : ${percentile(sorted, 99).toFixed(1)} ms`);
console.log(`   latency max : ${(sorted[sorted.length - 1] ?? 0).toFixed(1)} ms`);

const statuses = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);
if (statuses.length > 0) {
  console.log(`   status codes: ${statuses.map(([s, n]) => `${s}=${n}`).join(", ")}`);
}

// Rough real-user estimate: assumed user = 1 request every 3 seconds
const perUserRps = 1 / 3;
console.log(
  `\n👥 At p95 latency and 1 request / 3s per real user, this run roughly equals ` +
    `${Math.round(rps / perUserRps)} active users.`
);

const verdict =
  successRate >= 99 && percentile(sorted, 95) < 500
    ? "✅ OK — error < 1% and p95 < 500ms"
    : "⚠️  NEEDS ATTENTION — check p95 / error rate / DB limits";
console.log(`${verdict}\n`);
