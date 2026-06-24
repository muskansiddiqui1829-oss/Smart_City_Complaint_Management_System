# 🏙️ Smart City Complaint Management Platform

A production-grade MERN stack web application for managing civic complaints. Citizens can submit and track complaints, while administrators manage resolutions across departments.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Hook Form, Zod, Framer Motion
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT Auth
- **Storage**: Cloudinary (image uploads)
- **Email**: Nodemailer (Gmail SMTP)
- **Deployment**: Render (backend) + Vercel (frontend)

---

## ✨ Features

### Citizens
- Register/login with JWT authentication
- Submit complaints with photos (up to 5), location, category, priority
- Real-time status tracking with visual progress timeline
- Email notifications on every status update
- Upvote similar complaints
- Rate resolved complaints (1–5 stars)
- View notification center with unread badge

### Admins
- Platform-wide analytics dashboard (charts, KPIs)
- Manage all complaints: filter, search, bulk status update, CSV export
- Assign complaints to department heads
- User management: roles, activate/deactivate, delete
- Send bulk notifications

### Department Heads
- View and update complaints in their assigned department
- Status updates with comments

---

## 📁 Project Structure

```
smart-city/
├── backend/
│   ├── config/         # DB, Cloudinary, Logger
│   ├── controllers/    # Auth, Complaint, Admin, User
│   ├── middleware/     # Auth, Error, Validation, Async
│   ├── models/         # User, Complaint, Notification
│   ├── routes/         # Auth, Complaint, Admin, User routes
│   ├── utils/          # Email, AppError
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/ # Layout, UI components
│   │   ├── context/    # AuthContext
│   │   ├── pages/      # All pages + admin pages
│   │   └── services/   # Axios API service
│   └── vite.config.js
├── render.yaml
└── README.md
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Gmail App Password

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🌐 Deployment

### 1. Deploy Backend to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18
5. Add all Environment Variables from `.env.example`:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — random 64-char string
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `SMTP_EMAIL`, `SMTP_PASSWORD` — Gmail + App Password
   - `FRONTEND_URL` — your Vercel URL (set after frontend deploy)
6. Deploy → copy your Render URL (e.g. `https://smart-city-api.onrender.com`)

### 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Deploy → copy your Vercel URL
6. Go back to Render → update `FRONTEND_URL` to your Vercel URL
7. Re-deploy backend to apply the change

### 3. Create Admin User

After deployment, register a user normally, then update their role in MongoDB Atlas:
```js
// In MongoDB Atlas → Browse Collections → users
// Find your user and update:
{ $set: { role: "admin" } }
```

Or use MongoDB Atlas Data Explorer to run:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 🔐 Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_EXPIRE` | Token expiry (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (e.g. `587`) |
| `SMTP_EMAIL` | Gmail address |
| `SMTP_PASSWORD` | Gmail App Password |
| `FROM_EMAIL` | Sender email |
| `FROM_NAME` | Sender name |
| `FRONTEND_URL` | Your Vercel frontend URL |

---

## 📊 API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/update-profile` — Update profile
- `POST /api/auth/forgot-password` — Forgot password
- `PUT /api/auth/reset-password/:token` — Reset password

### Complaints
- `GET /api/complaints` — Get user's complaints
- `POST /api/complaints` — Submit complaint (multipart)
- `GET /api/complaints/:id` — Get complaint details
- `PUT /api/complaints/:id/status` — Update status (admin)
- `PUT /api/complaints/:id/assign` — Assign complaint (admin)
- `PUT /api/complaints/:id/upvote` — Upvote
- `PUT /api/complaints/:id/rate` — Rate complaint
- `GET /api/complaints/stats` — Dashboard stats
- `GET /api/complaints/public` — Public complaints feed

### Admin
- `GET /api/admin/analytics` — Platform analytics
- `GET /api/admin/complaints` — All complaints
- `GET /api/admin/users` — All users
- `PUT /api/admin/users/:id` — Update user
- `DELETE /api/admin/users/:id` — Delete user

### Notifications
- `GET /api/users/notifications` — Get notifications
- `PUT /api/users/notifications/read` — Mark as read
- `DELETE /api/users/notifications/:id` — Delete

---

## 📄 License

MIT — Free to use for educational and commercial purposes.
