# Smart Society OS - Features and API Guide

This document summarizes major modules in the project, including newly added capabilities like Voting, QR Pass, Maintenance Calculator, and Quick Help Hub.

---

## 1) Authentication and Roles

### What it does
- Login/register users and issue JWT token.
- Supports roles: `admin`, `resident`, `guard`, `staff`.
- Protects routes and feature access based on role.

### Frontend
- `frontend/lib/auth.ts`
- `frontend/app/login/page.tsx`

### Backend APIs
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users?role=...` (admin)
- `POST /api/auth/updateLoginTime`

---

## 2) Dashboard Analytics

### What it does
- Shows billing analytics, leaderboard insights, and latest notices.
- Includes paid/unpaid/overdue breakdown and trend visuals.

### Frontend
- `frontend/app/dashboard/page.tsx`

### Backend APIs used
- `GET /api/billing?sort=dueDate` (admin)
- `GET /api/billing/me` (resident)
- `GET /api/leaderboard`
- `GET /api/notices`

---

## 3) QR Pass (Entry Pass)

### What it does
- Adds a **Pass** button in top navbar.
- Opens modal with user QR entry pass.
- QR refreshes every 30 seconds automatically.

### Security note
- QR uses temporary token format:
  - `user_id:<id>|timestamp:<time>`
- No personal profile details are embedded.

### Frontend
- `frontend/components/qr-pass-modal.tsx`
- Injected in navbar via `frontend/components/Shell.tsx`

### Backend APIs
- None (client-side token mock for now).

---

## 4) Video Meetings

### What it does
- Create/join rooms for resident meetings.
- Quick room presets (General/Committee/Maintenance).
- In-browser live meeting embed.

### Stack
- Jitsi Meet external API (`meet.jit.si`)

### Frontend
- `frontend/app/meetings/page.tsx`

### Backend APIs
- None (direct Jitsi integration from frontend).

---

## 5) Maintenance Calculator (Admin Finance Engine)

### What it does
- Admin calculates monthly maintenance based on:
  - Flat size
  - Amenities
  - Parking
  - Expense heads (water/security/lift/common)
- Generates bill automatically.
- Has invoice preview and demo placeholders for reminders/payments.

### Frontend
- `frontend/app/admin/maintenance/page.tsx`

### Backend APIs used
- `GET /api/auth/users?role=resident`
- `POST /api/billing/new`

---

## 6) Digital Voting System (Mini Governance)

### What it does
- Admin creates poll topic and dynamic options/candidates.
- Residents vote with OTP verification.
- Enforces one vote per household.
- Real-time result dashboard and participation analytics.
- Supports anonymous voting.
- Includes blockchain-style hash-chain vote logs for trust.
- Deadline reminders placeholder.

### Frontend
- Resident voting: `frontend/app/voting/page.tsx`
- Admin voting management: `frontend/app/admin/voting/page.tsx`

### Backend
- Models:
  - `backend/src/models/poll.js`
  - `backend/src/models/voteLog.js`
- Controller:
  - `backend/src/controllers/votingController.js`
- Routes:
  - `backend/src/routes/voting.js`

### Voting APIs
- `POST /api/voting` (admin create poll)
- `GET /api/voting` (list polls)
- `POST /api/voting/:id/request-otp` (request OTP)
- `POST /api/voting/:id/vote` (cast vote)
- `GET /api/voting/:id/results` (results + analytics)
- `GET /api/voting/:id/logs` (admin trust logs)
- `POST /api/voting/:id/remind` (admin reminders placeholder)

### OTP behavior
- Demo mode uses fixed OTP:
  - `123456`
- Can be overridden via env var:
  - `VOTING_DEMO_OTP`

---

## 7) Quick Help Hub (Smart Assistance Hub)

### What it does
- Emergency contacts (security/ambulance/fire).
- Verified local services (plumber/electrician/maid/etc.).
- Resident-to-resident help requests.
- One-tap Call/WhatsApp links.
- Vendor availability status (`online`/`offline`), admin manageable.

### Frontend
- `frontend/app/help/page.tsx`
- Navigation link in `frontend/components/Sidebar.tsx`

### Backend
- Models:
  - `backend/src/models/serviceProvider.js`
  - `backend/src/models/helpRequest.js`
- Controller:
  - `backend/src/controllers/helpController.js`
- Routes:
  - `backend/src/routes/help.js`

### Help Hub APIs
- `GET /api/help` (hub data)
- `POST /api/help/requests` (create resident help request)
- `PATCH /api/help/requests/:id/close` (close help request)
- `POST /api/help/services` (admin add provider)
- `PATCH /api/help/services/:id` (admin update provider / availability)

---

## 8) Billing Module

### What it does
- Resident view of own bills.
- Admin full billing management (create, filter, mark paid, status updates).

### Frontend
- Resident: `frontend/app/billing/page.tsx`
- Admin: `frontend/app/admin/bills/page.tsx`

### Backend APIs
- `GET /api/billing/me`
- `PATCH /api/billing/:id/paid`
- `GET /api/billing`
- `GET /api/billing/:id`
- `PUT /api/billing/:id/status`
- `POST /api/billing/new`
- `POST /api/billing` (legacy upsert)

---

## 9) Other Core Modules

- Complaints
- Visitors
- Notices
- Leaderboard
- Lost & Found
- Marketplace
- AI Suggestion
- Emergency / Panic flow

These modules are exposed through their respective `/api/...` routes and mapped in sidebar navigation by role.

---

## UI/UX Infrastructure Notes

- Sidebar is now collapsible with persisted state:
  - `frontend/components/Shell.tsx`
  - `frontend/components/Sidebar.tsx`
- Theme toggle supports light/dark with persistence:
  - `frontend/components/ThemeToggle.tsx`
  - `frontend/app/globals.css`

