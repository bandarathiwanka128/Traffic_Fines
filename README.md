# Traffic Fine Management System

Full-stack app: React frontend + Node.js/Express backend + MongoDB.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### Backend
```bash
cd backend
npm install
# Edit .env if needed (MONGO_URI, JWT_SECRET)
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

## Project Structure
```
traffic_fine/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/  (auth, fines, users)
│   │   ├── middleware/auth.js
│   │   ├── models/       (User, Fine)
│   │   └── routes/       (auth, fines, users)
│   └── server.js
└── frontend/
    └── src/
        ├── context/AuthContext.js
        ├── pages/  (Login, Register, Dashboard, FinesList, FineForm, FineDetail, Users)
        ├── services/api.js
        └── components/Layout.js
```

## Roles & Access
| Feature         | Admin | Officer | Citizen |
|----------------|-------|---------|---------|
| View fines     | ✓     | ✓       | ✓       |
| Issue fine     | ✓     | ✓       |         |
| Edit fine      | ✓     | ✓       |         |
| Delete fine    | ✓     |         |         |
| Pay fine       | ✓     | ✓       | ✓       |
| Manage users   | ✓     |         |         |
| View stats     | ✓     |         |         |

## API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/fines          ?status=&plate=&page=&limit=
POST   /api/fines
GET    /api/fines/stats
GET    /api/fines/:id
PUT    /api/fines/:id
PATCH  /api/fines/:id/pay
DELETE /api/fines/:id

GET    /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```
