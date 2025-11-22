##Synkro – Smart Society Management System

Synkro is a smart society management platform built to simplify communication, security, billing, and community operations in residential apartment complexes.
It integrates AI-driven suggestions, visitor photo verification, panic alerts, marketplace, complaint tracking, and more.

##Features
Resident Features
Register and track complaints with a timeline (Submitted → Assigned → In Progress → Resolved)
View bills, notices, and announcements
Approve or deny visitors with real-time photo verification
Panic Button for emergency SMS/Call alerts
Marketplace for selling or bartering items within society
Lost & Found section
See assigned staff for each complaint
Dark/Light theme toggle
Guard Features
Add visitors with photo upload
See resident approval status instantly
Auto-refresh visitor dashboard
Receive emergency alerts
Admin Features
Add and manage bills for each resident
View, assign, and resolve all complaints
Post society notices
View visitor logs
Dashboard with summaries
AI Features
AI-based complaint triage
Priority suggestions
Short recommendations based on issue
Works with Gemini or Hugging Face models

##Tech Stack
Frontend
Next.js 13+
React
Tailwind CSS
Shadcn UI
Backend
Node.js
Express.js
REST APIs
JWT Authentication
Database
MongoDB Atlas
Cloud Services
Cloudinary for storing visitor photos
Twilio for SMS/Call alerts
Hugging Face / Gemini for AI

##Deployment
Frontend: Vercel / Replit
Backend: Render / Railway

##Project Structure
Synkro/
 ├── backend/
 │   ├── controllers/
 │   ├── routes/
 │   ├── models/
 │   ├── config/
 │   ├── seed.js
 │   └── server.js
 ├── frontend/
 │   ├── app/
 │   ├── components/
 │   ├── lib/
 │   ├── styles/
 │   └── package.json
 ├── .gitignore
 ├── README.md
 └── package.json

##How to Run Locally

Backend Setup
Create backend/.env:
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret-key

TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM=+1xxxxxxx
EMERGENCY_TO=+91xxxxxxxxxx

CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name


Start backend:
cd backend
npm install
npm run seed
npm run dev

Frontend Setup


Create frontend/.env.local:

NEXT_PUBLIC_API_BASE=http://localhost:5000


Start frontend:
cd frontend
npm install
npm run dev

##Future Enhancements
IoT-based water and electricity monitoring
Push notifications
Automatic complaint escalation
Monthly analytics for admins
Mobile app version using Flutter
