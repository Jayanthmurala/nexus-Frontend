# Nexus Development Setup Guide

Complete setup guide for the Nexus academic collaboration platform development environment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Service Configuration](#service-configuration)
- [Frontend Setup](#frontend-setup)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 8+ (comes with Node.js)
- **PostgreSQL**: Version 14+ for database
- **Redis**: Version 6+ for caching
- **Git**: For version control

### Development Tools (Recommended)
- **VS Code**: With TypeScript, Prisma, and Tailwind CSS extensions
- **Postman/Insomnia**: For API testing
- **pgAdmin**: PostgreSQL administration tool
- **Redis Commander**: Redis GUI client

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nexus
```

### 2. Install Dependencies

#### Backend Services
```bash
# Auth Service
cd nexusbackend/auth-service
npm install

# Profile Service
cd ../profile-service
npm install

# Projects Service
cd ../projects-service
npm install

# Events Service
cd ../event-service
npm install

# Network Service
cd ../network-service
npm install
```

#### Frontend
```bash
cd nexus
npm install
```

## Database Configuration

### 1. PostgreSQL Setup
Create separate databases for each service:

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE nexus_auth;
CREATE DATABASE nexus_profile;
CREATE DATABASE nexus_projects;
CREATE DATABASE nexus_events;
CREATE DATABASE nexus_network;

-- Create development user (optional)
CREATE USER nexus_dev WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nexus_auth TO nexus_dev;
GRANT ALL PRIVILEGES ON DATABASE nexus_profile TO nexus_dev;
GRANT ALL PRIVILEGES ON DATABASE nexus_projects TO nexus_dev;
GRANT ALL PRIVILEGES ON DATABASE nexus_events TO nexus_dev;
GRANT ALL PRIVILEGES ON DATABASE nexus_network TO nexus_dev;
```

### 2. Redis Setup
Start Redis server:
```bash
# On macOS with Homebrew
brew services start redis

# On Ubuntu/Debian
sudo systemctl start redis-server

# On Windows (with Redis for Windows)
redis-server
```

## Service Configuration

### 1. Auth Service Environment
Create `nexusbackend/auth-service/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_auth"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# JWKS Configuration
JWKS_URL="http://localhost:3001/.well-known/jwks.json"

# Server Configuration
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# Email Configuration (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@nexus.edu"

# OAuth Configuration (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
ENABLE_REDIS_CACHE=true
```

### 2. Profile Service Environment
Create `nexusbackend/profile-service/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_profile"

# Server Configuration
PORT=3002
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# Auth Service Integration
AUTH_SERVICE_URL="http://localhost:3001"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
ENABLE_REDIS_CACHE=true

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Projects Service Environment
Create `nexusbackend/projects-service/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_projects"

# Server Configuration
PORT=4003
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# Auth Service Integration
AUTH_SERVICE_URL="http://localhost:3001"
PROFILE_SERVICE_URL="http://localhost:3002"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
ENABLE_REDIS_CACHE=true

# WebSocket Configuration
ENABLE_WEBSOCKET=true
WEBSOCKET_CORS_ORIGIN="http://localhost:3000"

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Events Service Environment
Create `nexusbackend/event-service/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_events"

# Server Configuration
PORT=4004
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# Auth Service Integration
AUTH_SERVICE_URL="http://localhost:3001"
PROFILE_SERVICE_URL="http://localhost:3002"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
ENABLE_REDIS_CACHE=true

# WebSocket Configuration
ENABLE_WEBSOCKET=true
WEBSOCKET_CORS_ORIGIN="http://localhost:3000"

# Badge System Integration
REQUIRED_BADGES_COUNT=8
```

### 5. Network Service Environment
Create `nexusbackend/network-service/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_network"

# Server Configuration
PORT=4005
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# Auth Service Integration
AUTH_SERVICE_URL="http://localhost:3001"
PROFILE_SERVICE_URL="http://localhost:3002"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
ENABLE_REDIS_CACHE=true

# WebSocket Configuration
ENABLE_WEBSOCKET=true
WEBSOCKET_CORS_ORIGIN="http://localhost:3000"

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## Frontend Setup

### 1. Frontend Environment
Create `nexus/.env.local`:
```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-min-32-chars"

# Service URLs
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_PROFILE_API_BASE_URL="http://localhost:3002"
NEXT_PUBLIC_PROJECTS_API_BASE_URL="http://localhost:4003"
NEXT_PUBLIC_EVENTS_API_BASE_URL="http://localhost:4004"
NEXT_PUBLIC_NETWORK_API_BASE_URL="http://localhost:4005"

# WebSocket URLs
NEXT_PUBLIC_PROJECTS_WS_URL="ws://localhost:4003"
NEXT_PUBLIC_EVENTS_WS_URL="ws://localhost:4004"
NEXT_PUBLIC_NETWORK_WS_URL="ws://localhost:4005"

# OAuth Configuration (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# File Upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_UPLOAD_PRESET="your-upload-preset"
```

## Database Initialization

### 1. Run Prisma Migrations
Initialize each service database:

```bash
# Auth Service
cd nexusbackend/auth-service
npx prisma migrate dev --name init
npx prisma generate

# Profile Service
cd ../profile-service
npx prisma migrate dev --name init
npx prisma generate

# Projects Service
cd ../projects-service
npx prisma migrate dev --name init
npx prisma generate

# Events Service
cd ../event-service
npx prisma migrate dev --name init
npx prisma generate

# Network Service
cd ../network-service
npx prisma migrate dev --name init
npx prisma generate
```

### 2. Seed Development Data (Optional)
```bash
# Each service with seed script
cd nexusbackend/auth-service
npm run seed

cd ../profile-service
npm run seed

# Repeat for other services as needed
```

## Development Workflow

### 1. Start All Services

#### Backend Services (in separate terminals)
```bash
# Terminal 1 - Auth Service
cd nexusbackend/auth-service
npm run dev

# Terminal 2 - Profile Service
cd nexusbackend/profile-service
npm run dev

# Terminal 3 - Projects Service
cd nexusbackend/projects-service
npm run dev

# Terminal 4 - Events Service
cd nexusbackend/event-service
npm run dev

# Terminal 5 - Network Service
cd nexusbackend/network-service
npm run dev
```

#### Frontend
```bash
# Terminal 6 - Frontend
cd nexus
npm run dev
```

### 2. Development Scripts

#### Backend Services
```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npx prisma studio          # Database GUI
npx prisma migrate dev      # Create migration
npx prisma generate         # Generate client
npx prisma db push          # Push schema changes
npx prisma db seed          # Run seed script

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

#### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Component testing
npm run test
npm run test:watch
```

### 3. Database Management

#### Prisma Studio
Access database GUI for each service:
```bash
cd nexusbackend/[service-name]
npx prisma studio
```

#### Schema Changes
When modifying Prisma schemas:
```bash
# Create and apply migration
npx prisma migrate dev --name description-of-change

# Generate updated client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

## Development Tools & Extensions

### VS Code Extensions
- **Prisma**: Syntax highlighting and IntelliSense
- **TypeScript Importer**: Auto-import TypeScript modules
- **Tailwind CSS IntelliSense**: Tailwind class suggestions
- **ES7+ React/Redux/React-Native snippets**: React snippets
- **Auto Rename Tag**: Automatically rename paired HTML/JSX tags
- **Bracket Pair Colorizer**: Color matching brackets
- **GitLens**: Enhanced Git capabilities

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "prisma.showPrismaDataPlatformNotification": false
}
```

## Troubleshooting

### Common Issues

#### Port Conflicts
If ports are already in use:
```bash
# Find process using port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Database Connection Issues
1. Verify PostgreSQL is running
2. Check database URLs in `.env` files
3. Ensure databases exist
4. Verify user permissions

#### Redis Connection Issues
1. Verify Redis is running: `redis-cli ping`
2. Check Redis URL in `.env` files
3. Disable Redis cache temporarily: `ENABLE_REDIS_CACHE=false`

#### JWT Token Issues
1. Ensure JWT secrets match across services
2. Check token expiry settings
3. Clear browser cookies and localStorage
4. Verify JWKS URL accessibility

#### CORS Issues
1. Check CORS_ORIGIN settings in backend services
2. Verify frontend URL matches CORS configuration
3. Ensure credentials are included in requests

#### WebSocket Connection Issues
1. Check WebSocket URLs in frontend environment
2. Verify CORS settings for WebSocket
3. Check browser network tab for connection errors
4. Ensure WebSocket is enabled in service configuration

### Debug Mode
Enable debug logging:
```env
# In service .env files
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

### Health Checks
Verify services are running:
```bash
# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
curl http://localhost:4005/health

# Check frontend
curl http://localhost:3000
```

### Performance Monitoring
Monitor service performance:
```bash
# Check service logs
npm run dev  # Shows console output

# Monitor database connections
npx prisma studio

# Monitor Redis
redis-cli monitor
```

This setup guide provides everything needed to get the Nexus platform running in development mode. Follow the steps in order and refer to the troubleshooting section for common issues.
