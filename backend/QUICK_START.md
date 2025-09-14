# MeCabal Backend - Quick Start Guide

Get MeCabal backend running in under 5 minutes! 🚀

## 🏃‍♂️ Super Quick Start (One Command)

After cloning the repository, run this single command in the backend directory:

```bash
chmod +x install.sh && ./install.sh && ./deploy.sh
```

This will:
1. Fix all script permissions
2. Set up environment files
3. Install Docker if needed
4. Deploy all backend services

## 📋 Step-by-Step Instructions

### 1. Clone and Navigate
```bash
git clone https://github.com/your-org/mecabal.git
cd mecabal/backend
```

### 2. Fix Permissions (Important!)
```bash
# This fixes the "Permission denied" error
chmod +x install.sh setup.sh deploy.sh
```

### 3. Run Setup
```bash
./setup.sh
```

This will:
- Create necessary directories
- Copy `.env.example` to `.env`
- Install Node.js dependencies (optional)
- Check system requirements

### 4. Configure Environment
```bash
nano .env  # or use your preferred editor
```

**Required settings:**
```env
# Email service (Brevo)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SMTP_USER=your_smtp_username
BREVO_FROM_EMAIL=noreply@mecabal.com

# SMS service (SmartSMS)
SMARTSMS_API_TOKEN=your_smartsms_token_here

# WhatsApp service (Message Central)  
MESSAGE_CENTRAL_AUTH_TOKEN=your_message_central_token
MESSAGE_CENTRAL_CUSTOMER_ID=your_customer_id

# JWT secrets (generate random strings)
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
```

### 5. Deploy Backend
```bash
./deploy.sh
```

The script will:
- Install Docker automatically if needed
- Build and start all services
- Set up databases and infrastructure
- Perform health checks

## 🎯 What You Get

After successful deployment:

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:3000 | Main API endpoint |
| **Auth Service** | http://localhost:3001/auth | Authentication & OTP |
| **Swagger Docs** | http://localhost:3001/api | API documentation |
| **PostgreSQL** | localhost:5432 | Main database |
| **Redis** | localhost:6379 | Caching & sessions |
| **MinIO** | http://localhost:9000 | File storage |
| **RabbitMQ** | http://localhost:15672 | Message queue admin |

## ✅ Test Your Deployment

### 1. Health Check
```bash
curl http://localhost:3000/health
# Should return: {"status":"healthy","service":"api-gateway","timestamp":"..."}
```

### 2. Auth Service Health
```bash
curl http://localhost:3001/auth/health
# Should return: {"status":"healthy","service":"auth-service","timestamp":"..."}
```

### 3. Send Test OTP
```bash
curl -X POST http://localhost:3001/auth/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"registration"}'
```

### 4. View API Documentation
Open in browser: http://localhost:3001/api

## 🔧 Common Issues & Solutions

### "Permission denied" Error
```bash
# Fix script permissions
chmod +x setup.sh deploy.sh install.sh

# Then run setup
./setup.sh
```

### Docker Not Found
The deploy script will automatically install Docker, or:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# macOS
brew install --cask docker

# Windows: Download Docker Desktop
```

### Node.js Not Found
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Port Already in Use
```bash
# Stop existing services
docker-compose -f docker-compose.production.yml down

# Or kill process using port
sudo lsof -ti:3000 | xargs sudo kill -9
```

### Environment Variables Missing
```bash
# Copy example and edit
cp .env.example .env
nano .env
```

## 🚀 Production Deployment

For production with SSL and domain:

1. **Set domain in .env:**
   ```env
   NODE_ENV=production
   DOMAIN=api.mecabal.com
   ```

2. **Run with SSL setup:**
   ```bash
   ./deploy.sh
   # Script will offer to generate Let's Encrypt certificates
   ```

3. **Update DNS:**
   Point `api.mecabal.com` to your server IP

## 🛟 Need Help?

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f auth-service
```

### Restart Services
```bash
docker-compose -f docker-compose.production.yml restart
```

### Stop Everything
```bash
docker-compose -f docker-compose.production.yml down
```

### Complete Reset
```bash
docker-compose -f docker-compose.production.yml down -v
./deploy.sh  # Redeploy from scratch
```

## 📱 Next Steps

Once backend is running:

1. **Test API endpoints** with Postman or curl
2. **Update mobile app** to use new backend URL
3. **Configure external services** (Brevo, SmartSMS, Message Central)
4. **Set up monitoring** and alerts
5. **Configure SSL certificates** for production

## 🎉 Success!

Your MeCabal backend is now running! 

The backend APIs are ready for your mobile app integration. All authentication, OTP, and user management features are available at the endpoints listed above.

**Happy coding!** 🇳🇬