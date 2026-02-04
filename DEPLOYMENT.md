# Production Deployment Guide

This guide covers deploying the Visitor Management System with a React frontend and Node.js/MySQL backend.

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   MySQL DB      │
│   (React/Vite)  │     │   (Node.js)     │     │   Database      │
│   Vercel/etc    │     │   Railway/etc   │     │   PlanetScale   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Part 1: Database Setup (MySQL)

### Option A: Cloud MySQL (Recommended for Production)

**PlanetScale** (Serverless MySQL):
1. Create account at https://planetscale.com
2. Create a new database
3. Get connection string from dashboard
4. Run the schema:
```bash
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE < mysql_database.sql
```

**Other options:**
- **Railway MySQL** - https://railway.app
- **AWS RDS** - https://aws.amazon.com/rds/mysql/
- **DigitalOcean Managed MySQL** - https://www.digitalocean.com/products/managed-databases-mysql

### Option B: Self-Hosted MySQL
1. Install MySQL 8.0+
2. Create database:
```sql
CREATE DATABASE visitor_management;
```
3. Import schema:
```bash
mysql -u root -p visitor_management < mysql_database.sql
```

---

## Part 2: Backend API Deployment

### Step 1: Prepare Backend Files

Create a new folder with these files:

**package.json:**
```json
{
  "name": "visitor-management-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

**index.js:** (copy contents from `backend_api_example.js`)

**.env.example:**
```env
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=visitor_management
PORT=3001
```

### Step 2: Deploy to Cloud Platform

**Option A: Railway (Easiest)**
1. Push backend to GitHub repo
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Add environment variables in Settings
5. Railway provides automatic HTTPS URL

**Option B: Render**
1. Go to https://render.com
2. Create "Web Service"
3. Connect GitHub repo
4. Set environment variables
5. Deploy

**Option C: DigitalOcean App Platform**
1. Go to https://cloud.digitalocean.com/apps
2. Create new App
3. Connect repo and configure

### Step 3: Configure CORS for Production

Update `backend_api_example.js`:
```javascript
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'https://your-app.lovable.app'
  ],
  credentials: true
}));
```

---

## Part 3: Frontend Deployment

### Step 1: Configure Environment Variable

Create `.env.production` in the frontend root:
```env
VITE_API_URL=https://your-backend-api.railway.app/api
```

### Step 2: Build the Frontend

```bash
npm run build
```

This creates a `dist` folder with static files.

### Step 3: Deploy Options

**Option A: Lovable Publish (Easiest)**
1. Click "Share" → "Publish" in Lovable
2. Your app is live!
3. Note: You'll need to set VITE_API_URL in Lovable's environment settings

**Option B: Vercel**
1. Push to GitHub
2. Import project at https://vercel.com
3. Add environment variable `VITE_API_URL`
4. Deploy

**Option C: Netlify**
1. Push to GitHub
2. Import at https://netlify.com
3. Add environment variable
4. Deploy

---

## Part 4: Environment Variables Checklist

### Backend (.env)
```env
# Database
DB_HOST=your-mysql-host.com
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=visitor_management

# Server
PORT=3001
NODE_ENV=production
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-api-server.com/api
```

---

## Part 5: Testing Production Setup

### 1. Test Database Connection
```bash
curl https://your-api-server.com/api/health
```
Expected response:
```json
{"status":"ok","database":"connected"}
```

### 2. Test API Endpoints
```bash
# Get visitors
curl https://your-api-server.com/api/visitors

# Get dashboard stats
curl https://your-api-server.com/api/statistics/dashboard
```

### 3. Test Frontend
- Open your deployed frontend URL
- Check browser console for any CORS or API errors
- Test check-in/check-out flow

---

## Part 6: Security Checklist

- [ ] Use HTTPS for all connections
- [ ] Set strong database passwords
- [ ] Configure CORS to allow only your frontend domain
- [ ] Use environment variables (never commit secrets)
- [ ] Enable SSL for MySQL connections
- [ ] Implement rate limiting on API
- [ ] Add authentication for admin routes (future enhancement)

---

## Troubleshooting

### CORS Errors
- Ensure backend CORS origin includes your frontend domain
- Check that API URL doesn't have trailing slash

### Database Connection Failed
- Verify credentials in environment variables
- Check if database allows external connections
- Ensure SSL mode is correct

### API Returns 500 Errors
- Check backend logs for MySQL errors
- Verify database schema is imported correctly
- Test database connection with health endpoint

### Frontend Shows No Data
- Verify VITE_API_URL is set correctly
- Check browser Network tab for API calls
- Ensure backend is running and accessible

---

## Quick Start Commands

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start

# Frontend setup (local testing)
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3001/api" > .env
npm run dev
```

---

## Support

For issues with:
- **Lovable platform**: Check https://docs.lovable.dev
- **MySQL/Database**: Check your hosting provider's documentation
- **CORS/Networking**: Verify environment variables and allowed origins
