# First Issue (Open Source Finder)

Monorepo แยก **backend** (Express + Prisma) และ **frontend** (Next.js)

## Features (by phase)

| Phase | สิ่งที่ทำ |
|-------|----------|
| 0 | Monorepo, NextAuth GitHub, Prisma, landing |
| 1 | Skill profile sync จาก repos, skill level |
| 2 | Issue feed + filters (language, label, stars, age) + pagination |
| 3 | AI match (Claude) — score, summary, difficulty |
| 4 | Bookmarks + status pipeline + filter + remove |
| 5 | Weekly digest email (Resend) + preview + cron |
| 6 | Personalized feed, bookmark sync, nav badge, digest open tracking |

## โครงสร้าง

```
first-issue/
├── backend/          # Express :4000
├── frontend/         # Next.js :3000
└── package.json
```

## เริ่มต้น

```bash
npm install
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
npm run db:generate
npm run db:migrate
npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:4000/health  

`INTERNAL_API_KEY` ต้องตรงกันทั้ง `backend/.env` และ `frontend/.env.local`

## Environment (optional services)

| ตัวแปร | ใช้เมื่อ |
|--------|----------|
| `GITHUB_TOKEN` | Fallback สำหรับ GitHub API |
| `ANTHROPIC_API_KEY` | ปุ่ม AI match |
| `UPSTASH_REDIS_*` | Cache profile/issues (ไม่บังคับ) |
| `RESEND_API_KEY` | Weekly digest + test email |
| `CRON_SECRET` | ป้องกัน endpoint ส่ง digest รายสัปดาห์ |

## Weekly digest (cron)

```powershell
# จาก root — ตั้ง CRON_SECRET ก่อน
$env:CRON_SECRET="your-secret"
$env:BACKEND_URL="http://localhost:4000"
npm run digest:weekly
```

หรือ:

```powershell
curl -X POST http://localhost:4000/api/digest/cron/weekly -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

## Scripts

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | backend + frontend |
| `npm run build` | build ทั้ง monorepo |
| `npm run db:migrate` | Prisma migrate |
| `npm run digest:weekly` | ส่ง digest ให้ users ที่มี email |

## API flow

Browser → `/api/*` (Next.js) → proxy → Express พร้อม `X-User-Id` + `X-Github-Token`
