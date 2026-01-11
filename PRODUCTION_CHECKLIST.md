# Production Deployment Checklist

## Pre-Deployment

- [ ] All code is committed and pushed to Git repository
- [ ] `.env` file is created with all required variables
- [ ] `.env` file is **NOT** added to Git (.gitignore check)
- [ ] `.env.example` exists with template values
- [ ] Database backups are configured
- [ ] Domain name is registered and DNS configured (if applicable)
- [ ] SSL/TLS certificate is ready (Coolify provides Let's Encrypt)
- [ ] Cloudinary credentials are verified and working
- [ ] JWT_SECRET is a random, strong key (32+ characters)

## Database Setup

- [ ] PostgreSQL database is created and accessible
- [ ] DATABASE_URL is correctly formatted
- [ ] Database user has proper permissions
- [ ] Database backups are scheduled
- [ ] Test database connection before deployment:
  ```bash
  psql -h <host> -U <user> -d <dbname>
  ```

## Coolify Deployment

- [ ] Coolify instance is running and accessible
- [ ] Git repository is connected to Coolify
- [ ] Repository has all required files:
  - [ ] Dockerfile
  - [ ] docker-compose.yml
  - [ ] prisma/schema.prisma
  - [ ] prisma.config.ts
  - [ ] prisma/migrations/
  - [ ] .dockerignore
  - [ ] package.json & package-lock.json

## Environment Variables Configuration

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
- [ ] `JWT_SECRET` - Strong random JWT secret
- [ ] `NODE_ENV` - Set to `production`
- [ ] All variables are tested and working

## Coolify Application Settings

- [ ] Build Pack: Docker
- [ ] Dockerfile path: `./Dockerfile`
- [ ] Port: 3000
- [ ] Restart policy: unless-stopped
- [ ] Auto-deploy on Git push: Enabled (optional)
- [ ] Domain configured: (if using custom domain)
- [ ] SSL/TLS enabled: (auto via Let's Encrypt)

## Post-Deployment

- [ ] Application is running and healthy:
  ```bash
  curl https://yourdomain.com/api/v1
  # or
  curl http://localhost:3000/api/v1
  ```

- [ ] Check application logs in Coolify:
  - Prisma migrations ran successfully
  - No initialization errors
  - Application started on port 3000

- [ ] Test critical endpoints:
  - [ ] GET /api/v1 (health check)
  - [ ] GET /api/v1/lands (data retrieval)
  - [ ] GET /api/v1/houses (data retrieval)
  - [ ] POST /api/v1/reviews (data creation)
  - [ ] Image uploads work (Cloudinary integration)

- [ ] Monitor container health:
  ```bash
  docker ps
  # STATUS should show "Up (healthy)"
  ```

## Security Checklist

- [ ] No secrets committed to Git
- [ ] Environment variables are secure and unique per environment
- [ ] Database password is strong (12+ characters)
- [ ] JWT secret is strong (32+ characters)
- [ ] HTTPS/SSL is enabled
- [ ] Only necessary ports are exposed:
  - [ ] Port 3000 for application
  - [ ] Port 5432 for database (if not using external DB)
  - [ ] Ports 80/443 for web traffic

- [ ] Firewall rules are configured:
  - [ ] Allow port 80 (HTTP)
  - [ ] Allow port 443 (HTTPS)
  - [ ] Allow port 3000 only from reverse proxy
  - [ ] Block all other ports from public internet

## Monitoring & Logging

- [ ] Application logs are accessible in Coolify dashboard
- [ ] Check logs for errors:
  ```bash
  docker logs <container-id> -f
  ```

- [ ] Set up alerts for:
  - [ ] Container restart
  - [ ] High CPU/Memory usage
  - [ ] Database connection errors
  - [ ] Deployment failures

- [ ] Monitor application metrics:
  - [ ] Response times
  - [ ] Error rates
  - [ ] Database query performance

## Backup & Recovery

- [ ] Database backups are automated:
  - [ ] Frequency: Daily
  - [ ] Retention: At least 30 days
  - [ ] Location: External storage (AWS S3, etc.)

- [ ] Application code is version controlled:
  - [ ] Git history is clean
  - [ ] Tags for releases
  - [ ] Rollback plan documented

- [ ] Test restore procedure:
  - [ ] Restore database from backup
  - [ ] Verify data integrity
  - [ ] Document restore steps

## Scaling (If Needed)

- [ ] Horizontal scaling setup (load balancer)
- [ ] Database replication (if high volume)
- [ ] Cache layer configured (Redis, if needed)
- [ ] CDN configured for static assets (if applicable)

## Maintenance

- [ ] Regular security updates:
  - [ ] Docker images updated monthly
  - [ ] Dependencies updated quarterly
  - [ ] Node.js version keeps current

- [ ] Performance optimization:
  - [ ] Database indexes are optimized
  - [ ] Slow query logs reviewed
  - [ ] Connection pooling configured

- [ ] Documentation:
  - [ ] Deployment process documented
  - [ ] Troubleshooting guide created
  - [ ] Team has access to documentation

## Rollback Plan

- [ ] Previous stable version is documented
- [ ] Rollback procedure is tested:
  - [ ] Stop current deployment
  - [ ] Revert to previous Git commit
  - [ ] Run migrations (if needed)
  - [ ] Restart application

- [ ] Database migration rollback:
  - [ ] Backup created before migration
  - [ ] Rollback SQL scripts available
  - [ ] Restoration procedure tested

## Sign-Off

- [ ] Deployment team lead: _____________ Date: _______
- [ ] DevOps/Infrastructure: _____________ Date: _______
- [ ] Application owner: _____________ Date: _______

---

**If any item is unchecked, do NOT proceed with deployment.**

For issues, refer to:
- DEPLOYMENT.md - Comprehensive deployment guide
- DOCKER_QUICKSTART.md - Quick reference commands
- Coolify Documentation - https://coolify.io/docs
