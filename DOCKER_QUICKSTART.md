# Docker Deployment Quick Start

## Local Testing

```bash
# Build the Docker image
docker-compose build

# Start the application with PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## VPS Deployment Steps

### 1. SSH into your VPS

```bash
ssh user@your_vps_ip
cd /path/to/project
```

### 2. Clone/Pull your repository

```bash
git clone <repository-url> jglobalproperties
cd jglobalproperties
```

### 3. Create environment file

```bash
cp .env.example .env
nano .env  # Edit with your actual values
```

### 4. Deploy with Docker Compose

```bash
docker-compose up -d
```

### 5. Verify deployment

```bash
curl http://localhost:3000/api/v1
# Should return a response
```

## Coolify Deployment

1. **Connect Git Repository** to Coolify
2. **Set Build Type** to Docker
3. **Add Environment Variables** from `.env.example`
4. **Deploy** via Coolify Dashboard
5. **Configure Domain** (if needed)

## Important Environment Variables

| Variable                | Description                  | Example                                               |
| ----------------------- | ---------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name      | Your cloud name                                       |
| `CLOUDINARY_API_KEY`    | Cloudinary API key           | Your API key                                          |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret        | Your API secret                                       |
| `JWT_SECRET`            | JWT signing secret           | Random 32+ character string                           |
| `NODE_ENV`              | Environment                  | `production`                                          |

## Troubleshooting

```bash
# Check application logs
docker-compose logs app -f

# Check if containers are running
docker-compose ps

# Restart the application
docker-compose restart

# Stop all containers
docker-compose down

# Full restart
docker-compose down
docker-compose up -d
```

## Health Check

The Dockerfile includes a health check that verifies the API endpoint is responding. Monitor with:

```bash
docker-compose ps
# STATUS column will show: Up (healthy) or Up (unhealthy)
```

## For More Details

See `DEPLOYMENT.md` for comprehensive deployment guide.
