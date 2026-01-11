# JGlobal Properties - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on your VPS
- Coolify installed and configured
- PostgreSQL database (external or containerized)
- Cloudinary account for image uploads
- A domain name (optional but recommended)

## Environment Setup

### 1. Create `.env` file on your VPS

```bash
# SSH into your VPS
ssh user@your_vps_ip

# Navigate to your project directory
cd /path/to/jglobalproperties

# Create .env file with production values
nano .env
```

Add the following environment variables:

```env
# Database Configuration
# For external PostgreSQL (recommended for production)
DATABASE_URL=postgresql://username:password@your_postgres_host:5432/dbname?sslmode=require

# For local Docker PostgreSQL
# DATABASE_URL=postgresql://postgres:your_password@postgres:5432/neondb?sslmode=require

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Configuration
JWT_SECRET=your_long_random_jwt_secret_key

# Node Environment
NODE_ENV=production

# Application Port
APP_PORT=3000
```

## Deployment with Docker Compose

### 1. Build the Docker Image

```bash
docker-compose build
```

### 2. Start the Application

```bash
# In detached mode (background)
docker-compose up -d

# Or with logs visible
docker-compose up
```

### 3. Verify the Application is Running

```bash
# Check container status
docker-compose ps

# View application logs
docker-compose logs -f app

# Test the API
curl http://localhost:3000/api/v1
```

## Deployment with Coolify

### 1. Push Code to Git Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, Gitea, etc.):

```bash
git add .
git commit -m "Add Dockerfile and deployment configuration"
git push origin main
```

### 2. In Coolify Dashboard

1. **Create a New Project** in Coolify
2. **Connect Git Repository**
   - Select your Git provider
   - Authenticate and select the repository
   - Choose the branch (main/master)

3. **Configure Application**
   - **Name**: jglobalproperties
   - **Build Pack**: Docker
   - **Dockerfile**: `./Dockerfile`
   - **Port**: 3000

4. **Add Environment Variables**
   - Click "Add Environment Variable"
   - Add all variables from `.env`:
     - `DATABASE_URL`
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
     - `JWT_SECRET`
     - `NODE_ENV=production`

5. **Configure Database (if using external)**
   - Coolify supports multiple databases
   - Add PostgreSQL service if needed
   - Link DATABASE_URL to the PostgreSQL service

6. **Set Up Domain (Optional)**
   - Add custom domain
   - Configure SSL/TLS certificate (auto with Let's Encrypt)

7. **Deploy**
   - Click "Deploy"
   - Monitor deployment progress in logs
   - Verify application is running

## Database Migrations

The Dockerfile automatically runs migrations on startup:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
```

This ensures your database schema is up-to-date before the application starts.

## Backing Up Prisma Configuration

The deployment uses `prisma.config.ts` for migration commands, so ensure:

1. `prisma/schema.prisma` is in the repository ✅
2. `prisma.config.ts` is in the repository ✅
3. `prisma/migrations/` folder is in the repository ✅
4. `.env` file is NOT in the repository (use environment variables) ✅

## Troubleshooting

### Application won't start

```bash
# Check Docker logs
docker-compose logs app

# Common issues:
# - DATABASE_URL not set correctly
# - Database not accessible
# - Port already in use
```

### Database migration fails

```bash
# Access the container and check migration status
docker-compose exec app npx prisma migrate status

# Reset database (development only!)
docker-compose exec app npx prisma migrate reset
```

### Prisma client not found

```bash
# Regenerate Prisma client
docker-compose exec app npx prisma generate
```

### Image upload not working

Check Cloudinary credentials in environment variables:

```bash
docker-compose config | grep CLOUDINARY
```

## Performance Optimization

For production:

1. **Use external PostgreSQL** instead of Docker container
2. **Enable caching** in Coolify settings
3. **Set resource limits** in docker-compose:

   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

4. **Enable auto-restart**:
   ```yaml
   restart: unless-stopped
   ```

## Monitoring

Monitor your application with:

```bash
# Check container logs
docker-compose logs -f app

# Check resource usage
docker stats jglobalproperties_app

# Monitor database connections
# Access PostgreSQL container and check connections
```

## Security Best Practices

1. ✅ Use strong JWT_SECRET
2. ✅ Store sensitive values in environment variables only
3. ✅ Use SSL/TLS (Coolify provides Let's Encrypt)
4. ✅ Regular database backups
5. ✅ Keep Docker images updated
6. ✅ Use .env file only locally (never commit to git)

## Rollback Strategy

If deployment fails:

```bash
# Using Coolify: Click "Rollback" button
# Or manually with Docker:
docker-compose down
git checkout previous-working-commit
docker-compose up -d
```

## Support

For issues:

- Check application logs: `docker-compose logs app`
- Check database connectivity: `docker-compose exec app npm run prisma:studio`
- Review Coolify documentation: https://coolify.io/docs
