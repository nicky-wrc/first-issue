# First Issue (Open Source Finder)

Monorepo แยก **backend** (Express + Prisma) และ **frontend** (Next.js) ชัดเจน

## โครงสร้าง

```
first-issue/
├── backend/                 # Express API (:4000)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── lib/
│   │   └── middleware/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Next.js (:3000)
│   ├── src/
│   │   ├── app/             # routing + auth + API proxy
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   ├── next.config.mjs
│   └── tailwind.config.ts
├── package.json             # workspaces root
└── README.md
```

## เริ่มต้น

### 1. ติดตั้ง dependencies (root)

```bash
npm install
```

### 2. ตั้งค่า environment

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

- **backend/.env** — `DATABASE_URL`, `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, …
- **frontend/.env.local** — `NEXTAUTH_*`, `GITHUB_CLIENT_*`, `BACKEND_URL`
- **`INTERNAL_API_KEY`** ต้องตรงกันทั้งสองฝั่ง (ใช้ตอน login สร้าง user ใน DB)

### 3. Database (pgAdmin)

สร้าง DB `first_issue` แล้วรัน:

```bash
npm run db:generate
npm run db:migrate
```

### 4. รันทั้งสอง service

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:4000/health  

## การทำงานของ API

- Browser เรียก `/api/*` ที่ Next.js (port 3000)
- `frontend/src/app/api/[[...path]]` proxy ไป Express พร้อม session headers
- GitHub OAuth อยู่ที่ `frontend/src/app/api/auth/[...nextauth]` เท่านั้น

## Scripts

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | รัน backend + frontend พร้อมกัน |
| `npm run dev:backend` | Express เท่านั้น |
| `npm run dev:frontend` | Next.js เท่านั้น |
| `npm run build` | build ทั้ง monorepo |
| `npm run db:migrate` | Prisma migrate |
