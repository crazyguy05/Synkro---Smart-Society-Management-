# Smart Society OS

A smart housing management system for apartment societies.

Tech Stack
- Frontend: Next.js 14, Tailwind CSS, Shadcn UI, Framer Motion
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Optional APIs: Twilio, Cloudinary, OpenAI

Monorepo Structure
- frontend/  Next.js app (to be created)
- backend/   Express API

## Backend Setup

1. Create `.env` in `backend/` based on `.env.example`.
2. Install dependencies:
   ```bash
   npm install
   npm run dev
   ```

### Environment Variables
Copy `.env.example` to `.env` and fill:
- PORT=5000
- MONGODB_URI=Your Mongo connection string
- JWT_SECRET=A strong secret
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
- CLOUDINARY_URL or CLOUDINARY_* keys
- OPENAI_API_KEY (optional)

### Scripts
- `npm run dev` Start API with nodemon
- `npm start` Start API with node

## Frontend Setup (Next.js)
Will be scaffolded next with Tailwind, Shadcn UI, and Framer Motion.

## Deploy
- Frontend: Vercel
- Backend: Render

Render: set env vars; start command `npm start`; build command `npm install`.
Vercel: add NEXT_PUBLIC_API_BASE pointing to your backend URL.
