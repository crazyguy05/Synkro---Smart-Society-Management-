# Synkro / Smart Society OS — Complete Tech Stack

This document describes the **actual** technologies, libraries, and services used in this repository (as declared in `package.json` and project config). Versions reflect the repo at time of writing; run `npm list` in each app folder for live resolution.

---

## 1. High-level architecture

| Layer | Technology |
|--------|------------|
| **Client** | Next.js (App Router) + React + TypeScript |
| **Server API** | Node.js + Express (REST) |
| **Database** | MongoDB via Mongoose |
| **Auth** | JWT (Bearer token), bcrypt password hashing |
| **File / media** | Cloudinary, `express-fileupload` (temp files) |
| **Comms** | Twilio (SMS / voice where configured) |
| **AI** | OpenAI SDK + optional Hugging Face / external models (see `backend` AI routes) |
| **Video** | Jitsi Meet (`meet.jit.si`) embedded from the browser |

---

## 2. Frontend (`frontend/`)

### Core framework

| Item | Version / notes |
|------|------------------|
| **Runtime** | Node.js (for dev/build; match LTS recommended) |
| **Framework** | **Next.js 14.2.5** (App Router: `app/` directory) |
| **UI library** | **React 18.3.1** + **react-dom 18.3.1** |
| **Language** | **TypeScript 5.9.3** (`strict: false` in `tsconfig.json`) |

### Styling & UI

| Item | Version / notes |
|------|------------------|
| **CSS** | **Tailwind CSS 3.4.14** |
| **PostCSS** | 8.4.47 |
| **Autoprefixer** | 10.4.20 |
| **Dark mode** | `darkMode: 'class'` in `tailwind.config.js` |
| **Design system** | Custom utility classes (e.g. `.btn-glow`, `.card`) + CSS variables in `app/globals.css` — **not** shadcn/ui in `package.json` (README may mention it as a design direction) |

### Animation & utilities

| Package | Purpose |
|---------|---------|
| **framer-motion** ^11 | UI animations (where used) |
| **qrcode** ^1.5.4 | QR image generation for Entry Pass modal |

### Tooling

| Item | Notes |
|------|--------|
| **@types/node**, **@types/react** | Type definitions |
| **ESLint** | Optional / not listed in root `package.json` snippet — check repo for ESLint config if present |

### Frontend ↔ Backend

| Item | Notes |
|------|--------|
| **API base** | `NEXT_PUBLIC_API_BASE` (default `http://localhost:5000`) in `lib/api.ts` |
| **Transport** | `fetch` with JSON; `Authorization: Bearer <token>` when logged in |

---

## 3. Backend (`backend/`)

### Runtime & server

| Item | Version / notes |
|------|------------------|
| **Runtime** | **Node.js** (ES modules: `"type": "module"`) |
| **HTTP** | **Express 4.19.2** |
| **Dev reload** | **nodemon 3.1.0** |

### Database & ODM

| Package | Purpose |
|---------|---------|
| **mongoose 8.6.0** | MongoDB ODM, schemas in `src/models/` |
| **mongodb 6.20.0** | Official driver (transitive / tooling) |

### Security & auth

| Package | Purpose |
|---------|---------|
| **jsonwebtoken 9.0.2** | JWT sign/verify |
| **bcryptjs 2.4.3** | Password hashing |

### HTTP & uploads

| Package | Purpose |
|---------|---------|
| **cors** | Cross-origin (localhost dev) |
| **cookie-parser** | Cookies |
| **morgan** | HTTP request logging |
| **express-fileupload** | Multipart uploads (temp dir) |
| **multer** | File upload (where used) |

### Integrations

| Package | Purpose |
|---------|---------|
| **cloudinary 2.8.0** | Image/media hosting |
| **twilio 5.10.4** | SMS / voice (panic, emergency flows) |
| **axios 1.13.2** | Outbound HTTP (e.g. AI warm-up, external APIs) |
| **openai 4.52.7** | OpenAI-compatible AI calls (if configured) |

### Config

| Item | Notes |
|------|--------|
| **dotenv** | Loads `backend/.env` |
| **PORT** | Default `5000` |

---

## 4. Database & data model

| Item | Notes |
|------|--------|
| **MongoDB** | Atlas or self-hosted; URI in `MONGODB_URI` |
| **Mongoose** | Models: User, Bill, Notice, Complaint, Visitor, Reward, Marketplace, LostFound, Poll, VoteLog, ServiceProvider, HelpRequest, etc. |

---

## 5. External services (environment-driven)

| Service | Typical env vars | Usage |
|---------|------------------|--------|
| **MongoDB Atlas** | `MONGODB_URI` | Primary datastore |
| **Cloudinary** | `CLOUDINARY_*` | Visitor photos, uploads |
| **Twilio** | `TWILIO_*`, `EMERGENCY_TO` | Panic / emergency |
| **OpenAI** | API key in env (if used) | AI suggestions |
| **Hugging Face** | Optional in server | Model warm-up if configured |
| **Jitsi** | No backend key | `meet.jit.si` from browser |

---

## 6. DevOps & deployment (typical)

| Area | Common choices (from README / practice) |
|------|-------------------------------------------|
| **Frontend** | Vercel, Netlify, or Node host running `next build` + `next start` |
| **Backend** | Render, Railway, Fly.io, VPS with `node src/server.js` |
| **DB** | MongoDB Atlas |
| **Secrets** | Env vars on host; never commit `.env` |

---

## 7. Project structure (reference)

```
Synkro---Smart-Society-Management-/
├── backend/
│   └── src/
│       ├── server.js          # Express app entry
│       ├── config/            # DB, etc.
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       └── middleware/
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/
│   ├── lib/                   # api, auth
│   └── public/
└── docs/                      # Feature & stack docs
```

---

## 8. API style

- **REST** JSON over HTTP  
- **Auth header**: `Authorization: Bearer <JWT>`  
- **CORS**: configured for local dev (localhost / 127.0.0.1 on various ports)

---

## 9. Related documentation

- **Features & endpoints**: `docs/FEATURES_AND_APIS.md`
- **Run instructions**: `README.md`

---

*Last updated to match `frontend/package.json` and `backend/package.json` in this repo.*
