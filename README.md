# Training Dashboard

[![Node.js CI](https://github.com/sunnybunnyy/training-dashboard/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/sunnybunnyy/training-dashboard/actions/workflows/node.js.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/fffc6765-e8cd-4b79-bfe5-7f469270abdb/deploy-status)](https://app.netlify.com/projects/persimmon-planning/deploys)

A web application that helps athletes plan and track their training for upcoming races. Integrates with the Strava API to sync activities, provides intelligent training plan recommendations using machine learning, and offers a calendar-based interface for managing your training schedule.

## Features

- **Strava Integration** — Connect with Strava to automatically import your completed activities and sync workouts directly to your training plan
- **Training Plan Management** — Create and organize custom training plans with activities scheduled on specific dates
- **Calendar View** — Visualize your entire training schedule with an interactive full-calendar interface
- **Activity Planning** — Add detailed training activities with parameters like distance, pace, and route names
- **ML-Powered Recommendations** — Get intelligent training plan suggestions based on your recent performance metrics and workload
- **Training Analytics** — Track progress with detailed analytics including weekly distance, heart rate trends, and workload metrics
- **User Authentication** — Secure login and registration system for managing personal training data

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Redis (for caching)
- Python 3.8+ (for ML service)
- Strava API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sunnybunnyy/training-dashboard.git
   cd training-dashboard
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/training_db
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # Strava API
   STRAVA_CLIENT_ID=your_strava_client_id
   STRAVA_CLIENT_SECRET=your_strava_client_secret
   STRAVA_REDIRECT_URI=http://localhost:5000/auth/strava/callback
   
   # Server
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up the database**
   ```bash
   cd backend/db
   node populatedb.js  # Creates tables and initializes schema
   ```

5. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Development

**Option 1: Run frontend and backend separately**

Terminal 1 — Start the backend server:
```bash
cd backend
npm start
# Server runs at http://localhost:5000
```

Terminal 2 — Start the frontend dev server:
```bash
cd frontend
npm start
# App runs at http://localhost:5173 (or specified port)
```

**Option 2: Run together from root**
```bash
npm run serve
```

### Usage

1. **Register or Login** — Create an account or sign in with your credentials
2. **Connect Strava** — Click the Strava integration button to authorize and import your activities
3. **Create Training Plans** — Use the training plans panel to create a new plan for your upcoming race
4. **Plan Activities** — Click on calendar dates to add specific training activities with distance and pace targets
5. **Log Workouts** — Complete activities in Strava, then log them in the dashboard by selecting from your recent Strava activities
6. **View Analytics** — Check the analytics tab to monitor your training progress, weekly distance, and recommended plans

### Building for Production

**Frontend build**
```bash
cd frontend
npm run build
# Output in frontend/dist
```

**Backend deployment**
```bash
cd backend
npm start
```

The frontend is configured to deploy on Netlify, and the backend is deployed on Render.

## Project Structure

```
training-dashboard/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/      # React components (Login, Dashboard, Analytics)
│   │   ├── styles/          # Component CSS files
│   │   ├── utils/           # Utilities (API calls, PrivateRoute)
│   │   └── App.jsx          # Main app component with routing
│   └── vite.config.ts       # Vite configuration
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── server.js        # Main Express app
│   │   ├── recommend.js     # ML service integration
│   │   ├── ruleRecommender.js # Rule-based recommendations
│   │   ├── redisClient.js   # Redis client setup
│   │   └── labelHeuristics.js # Workload labeling logic
│   ├── db/
│   │   ├── pool.js          # PostgreSQL connection pool
│   │   ├── queries.js       # Database query functions
│   │   └── populatedb.js    # Database initialization
│   └── ml_service/          # Python Flask ML service
│       ├── recommend.py     # ML model for recommendations
│       ├── train.py         # Model training script
│       └── requirements.txt # Python dependencies
└── netlify.toml             # Netlify deployment configuration
```

## Tech Stack

**Frontend**
- React 19 with JavaScript
- Vite (build tool)
- React Router for navigation
- FullCalendar for calendar interface
- Recharts for analytics visualization
- Axios for API calls

**Backend**
- Node.js with Express
- PostgreSQL for data persistence
- Redis for caching
- Passport.js for authentication
- Passport Strava OAuth2 strategy
- jsonwebtoken (JWT) for session management

**ML Service**
- Python Flask
- scikit-learn for machine learning models
- pandas for data processing

**Deployment**
- Netlify (frontend)
- Render (ML service)
- GitHub Actions (CI/CD)

## Configuration

### Strava API Setup

1. Go to [Strava Settings > API](https://www.strava.com/settings/api)
2. Create a new application and get your Client ID and Secret
3. Set the Authorization Callback Domain to your app's domain
4. Add credentials to your `.env` file

### Database Setup

The project uses PostgreSQL. Ensure your database connection string is correct in the `.env` file. Run `populatedb.js` to initialize the schema.

### Redis Setup

Redis is used for caching. Ensure it's running locally or update `REDIS_URL` in `.env` to point to your Redis instance.