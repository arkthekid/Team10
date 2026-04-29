# UMass Marketplace

A full-stack marketplace platform for UMass students and faculty to buy, sell, and list items. Built with React + TypeScript + Vite + Tailwind on the frontend and Express + TypeORM + Supabase on the backend.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Contributing](#contributing)

---

## Project Overview

UMass Marketplace allows students to create listings, upload images, browse categories, and communicate with sellers through conversations. Admins have elevated access to manage the platform.

---

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS

**Backend**
- Node.js + Express
- TypeORM
- Supabase (PostgreSQL + Storage)
- Multer (file uploads)
- JWT (authentication)

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Data source, Supabase client
│   │   ├── controllers/     # Route handlers
│   │   ├── dto/     
│   │   ├── entities/        # TypeORM entities
│   │   ├── middleware/     # Auth, admin guards
│   │   ├── routes/          # Express routers
│   │   ├── seeds/     
│   │   ├── services/        # Business logic
│   │   ├── types/     
│   │   ├── utils/           # AppError, helpers
│   │   ├── app.ts
│   │   ├── server.ts        # Entry point
│   │   └── tests/
│   │── .gitignore
│   │── package-lock.json
│   │── package.json
│   └──tsconfig.json
├── documents/
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── data/
    │   ├── hooks/
    │   └── main.tsx
    └── package.json
```

---

## Setup & Installation

### Prerequisites

- Node.js v18+
- npm
- Supabase account and project

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Database
DB_HOST=your-host.supabase.com
DB_PORT=6543
DB_USER=postgres.your-user
DB_PASSWORD=your-password
DB_NAME=postgres

DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=774734355645-b2po9bc95bqt8iu0v5df91ftga7lqpu2.apps.googleusercontent.com
RESEND_API_KEY=re_2Do1MFfi_7NMvWwuz5gG6iaxs8SieyW3Y

# Frontend
FRONTEND_URL=http://localhost:8080
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=
```

> Never commit your `.env` file. A `.env.example` with placeholder values should be committed instead.

---

## Database Schema

### User
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | string |  |
| umassEmail | string | Unique |
| passwordHash | string | Hashed |
| role | string | `user` or `admin` |
| isVerified | boolean |  |
| verificationToken | string |  |

### Listing
| Column | Type | Notes |
|---|---|---|
| listingId | uuid | Primary key |
| name | string | |
| status | string | `available` or `sold_pending` or `completed`|
| pickUpLocation | string | |
| price | number | |
| sellerId | uuid | FK → User |
| buyerId | uuid | FK → User |
| description | string | |
| condtition | string | `New` or `Used`|
| categoryId | uuid | FK → Category |
| createdAt | timestamp | Auto-generated |
| updatedAt | timestamp | Auto-generated |
| sellerMarkedSoldAt | timestamp | Auto-generated |
| buyerMarkedReceivedAt | timestamp | Auto-generated |


### Conversation
| Column | Type | Notes |
|---|---|---|
| conversationId | uuid | Primary key |
| listingId | uuid | FK → Listing |
| buyerId | uuid | FK → User |
| sellerId | uuid | FK → User |
| createdAt | timestamp | Auto-generated |

---

## Contributing

1. Clone the repository
```bash
git clone https://github.com/your-org/umass-marketplace.git
```

2. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes
```bash
git commit -m "feat: add your feature"
```

4. Push and open a pull request
```bash
git push origin feature/your-feature-name
```

### Commit Convention

Use the following prefixes for commit messages:

- `feat:` new feature
- `fix:` bug fix
- `chore:` maintenance or config changes
- `docs:` documentation updates
- `refactor:` code restructure without behavior change
