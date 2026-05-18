const url = process.env.BACKEND_URL ?? "http://localhost:4000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("Set CRON_SECRET (same as backend/.env)");
  process.exit(1);
}

const res = await fetch(`${url}/api/digest/cron/weekly`, {
  method: "POST",
  headers: { "X-Cron-Secret": secret },
});

const body = await res.json();
console.log(res.status, body);
process.exit(res.ok ? 0 : 1);
