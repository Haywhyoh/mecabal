# MVP Server Sizing for 60,000 Users

## Overview

This document outlines the recommended server infrastructure for running the MeCabal backend to support 60,000 users during the MVP phase.

## Architecture Summary

The backend consists of:
- 9 NestJS microservices (API Gateway, Auth, User, Social, Messaging, Marketplace, Events, Business, Notification)
- PostgreSQL with PostGIS
- Redis for caching and sessions
- MinIO for object storage
- RabbitMQ for message queuing

## Recommended Server Setup

### Option 1: Single VPS (Cost-Effective MVP)

**Specifications:**
- 8 vCPU
- 16GB RAM
- 160GB SSD Storage

**Provider Options:**
| Provider | Price | Notes |
|----------|-------|-------|
| Hetzner CPX41 | €44/month (~$48) | **Best value** - Recommended |
| DigitalOcean Premium AMD | $96/month | Good performance, higher cost |
| Vultr High Frequency | $96/month | Similar to DigitalOcean |
| AWS Lightsail | $80/month | Good AWS integration |

**Memory Allocation:**
- API Gateway: 1GB RAM
- Auth Service: 1GB RAM
- User Service: 1.5GB RAM
- Social Service: 2GB RAM (most active)
- Messaging Service: 1.5GB RAM
- Marketplace Service: 1GB RAM
- Events Service: 1GB RAM
- Business Service: 1GB RAM
- Notification Service: 512MB RAM
- PostgreSQL: 2GB RAM
- Redis: 1GB RAM
- RabbitMQ: 512MB RAM
- MinIO: 512MB RAM

**Total:** ~15GB RAM allocated (leaving ~1GB for OS overhead)

### Option 2: Distributed Setup (Better Performance)

**Application Server:**
- 4 vCPU, 8GB RAM, 80GB SSD (~$48/month)
- Runs all 9 microservices

**Database Server:**
- 4 vCPU, 8GB RAM, 160GB SSD (~$48/month)
- Runs PostgreSQL, Redis, RabbitMQ, MinIO

**Total Cost:** ~$96/month

**Benefits:**
- Better database performance isolation
- Easier to scale database independently
- More resilient to service failures
- Better for monitoring and debugging

## Capacity Planning Assumptions

### User Metrics (60,000 Total Users)
- Daily Active Users (DAU): ~6,000 (10%)
- Peak Concurrent Users: ~600
- Peak Requests/Second: 50-100 RPS
- Average Session Duration: 15-20 minutes
- Geographic Distribution: Primarily Nigerian timezones

### Traffic Patterns
- Peak hours: 7-9 AM, 12-2 PM, 6-10 PM WAT (West Africa Time)
- Weekend traffic: ~70% of weekday traffic
- Event-driven spikes during community events

### Storage Estimates
- Database: ~50-100GB for 60K users
- Media Storage (MinIO): ~200-500GB
- Logs and backups: ~50GB

## Why This Works for MVP

1. **Lightweight Microservices**: NestJS services are efficient (~50-100MB each)
2. **Geographic Clustering**: Nigerian users in similar timezones reduces concurrent load
3. **Efficient Database**: PostgreSQL with PostGIS optimized for geographic queries
4. **Caching Strategy**: Redis reduces database load by 60-80%
5. **Stateless Architecture**: Allows easy horizontal scaling later
6. **Message Queue**: RabbitMQ handles async tasks efficiently

## Production Readiness Configuration

### Essential Optimizations

#### 1. Process Management
```bash
# Install PM2 for process management
npm install -g pm2

# Run services with clustering
pm2 start ecosystem.config.js --env production
```

#### 2. Nginx Reverse Proxy
```nginx
upstream api_gateway {
    least_conn;
    server localhost:3000;
}

server {
    listen 80;
    server_name api.mecabal.com;

    location / {
        proxy_pass http://api_gateway;
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
    }
}
```

#### 3. Database Configuration
```bash
# PostgreSQL settings for 8GB RAM server
max_connections = 100
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 20MB
maintenance_work_mem = 512MB
```

#### 4. Redis Configuration
```bash
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
```

### Pre-Launch Checklist

- [ ] Enable PM2 clustering for all Node services
- [ ] Configure Nginx reverse proxy with caching
- [ ] Set up database connection pooling (max 100 connections)
- [ ] Enable Redis for session storage
- [ ] Configure CDN for static assets (Cloudflare free tier)
- [ ] Set up monitoring (PM2, New Relic, or Datadog)
- [ ] Configure automated backups (daily database, weekly full)
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Configure log rotation and management
- [ ] Implement rate limiting on API Gateway
- [ ] Set up health check endpoints
- [ ] Configure alerting for critical failures

## Monitoring Requirements

### Key Metrics to Track

1. **Application Metrics**
   - Request rate and latency per service
   - Error rates (4xx, 5xx)
   - Active connections
   - Queue depths (RabbitMQ)

2. **Infrastructure Metrics**
   - CPU usage (alert if >80% for 5 minutes)
   - Memory usage (alert if >85%)
   - Disk I/O and space
   - Network bandwidth

3. **Database Metrics**
   - Query performance (slow queries >1s)
   - Connection pool usage
   - Cache hit ratios
   - Database size growth

### Recommended Tools
- **Application Monitoring**: PM2 Dashboard (free) or New Relic
- **Infrastructure**: Netdata (free, real-time)
- **Logs**: Logrotate + Loki (free) or Papertrail
- **Uptime**: UptimeRobot (free tier)
- **Alerts**: Discord/Slack webhooks

## Scaling Strategy

### When to Scale Up (Upgrade Current Server)

**Triggers:**
- CPU consistently >70% during normal hours
- Memory usage >80%
- Database query times increasing
- User complaints about performance

**Next Tier:** 16 vCPU, 32GB RAM (~$96-120/month)

### When to Scale Out (Add Servers)

**Triggers:**
- User base >100,000
- Peak concurrent users >2,000
- Geographic expansion beyond Nigeria
- New real-time features

**Horizontal Scaling Plan:**
1. Split microservices across multiple application servers
2. Set up PostgreSQL read replicas
3. Implement Redis cluster
4. Add load balancer (Nginx or HAProxy)

### Future Architecture (100K+ Users)

```
Load Balancer (Nginx/HAProxy)
├── App Server 1: API Gateway + Auth + User
├── App Server 2: Social + Messaging + Events
├── App Server 3: Marketplace + Business + Notification
├── Database Primary (PostgreSQL)
├── Database Replica (Read-only)
├── Redis Cluster (3 nodes)
└── Object Storage (MinIO cluster or S3)
```

## Cost Projections

### MVP Phase (0-60K Users)
| Item | Monthly Cost |
|------|--------------|
| Single VPS (Hetzner CPX41) | $48 |
| Domain + SSL | $2 |
| Backup Storage (100GB) | $5 |
| CDN (Cloudflare Free) | $0 |
| Monitoring (Free tier) | $0 |
| **Total** | **~$55/month** |

### Growth Phase (60K-150K Users)
| Item | Monthly Cost |
|------|--------------|
| Larger VPS (16 vCPU, 32GB) | $96 |
| Or: 2x App Servers | $48 × 2 = $96 |
| Database Server | $72 |
| Backup Storage (500GB) | $10 |
| CDN (Cloudflare Pro) | $20 |
| Monitoring | $25 |
| **Total** | **~$223/month** |

### Scale Phase (150K+ Users)
| Item | Monthly Cost |
|------|--------------|
| Load Balancer | $24 |
| App Servers (3x) | $48 × 3 = $144 |
| Database Primary | $120 |
| Database Replica | $120 |
| Redis Cluster | $72 |
| Object Storage (1TB) | $30 |
| CDN | $50 |
| Monitoring & Logs | $50 |
| **Total** | **~$610/month** |

## Recommended Approach

**Start Small, Scale Smart:**

1. **Launch:** Hetzner CPX41 (8 vCPU, 16GB RAM) at $48/month
2. **Monitor:** Track metrics closely for 2-4 weeks
3. **Optimize:** Tune configurations based on actual usage patterns
4. **Scale:** Upgrade only when metrics justify it

This approach minimizes initial costs while maintaining excellent performance for MVP launch.

## Nigeria-Specific Considerations

### Network Optimization
- Use Cloudflare for CDN (has Lagos edge servers)
- Consider local hosting providers for lower latency:
  - MainOne (Lagos data center)
  - Rack Centre (multiple Nigerian locations)

### Connectivity Challenges
- Implement aggressive caching (reduce API calls)
- Optimize payload sizes (gzip compression)
- Progressive loading for images
- Offline-first features where possible

### Cost Optimization
- International providers (Hetzner, DigitalOcean) often cheaper
- Use CDN to reduce bandwidth costs
- Implement efficient image compression
- Archive old data to cheaper storage

## Security Considerations

### Essential Security Measures
- Firewall: Only expose ports 80, 443, 22
- SSH: Disable password auth, use keys only
- Database: No public access, VPN/private network only
- Rate limiting: 100 requests/minute per IP
- DDoS protection: Cloudflare proxy
- Backups: Daily automated, 30-day retention
- Secrets: Use environment variables, never commit

## Support and Maintenance

### Backup Strategy
- **Database:** Daily automated backups, 30-day retention
- **Media Files:** Weekly backups to S3-compatible storage
- **Configuration:** Git repository for all configs
- **Testing:** Monthly restore tests

### Update Schedule
- **Security patches:** Weekly review, immediate critical patches
- **Dependencies:** Monthly updates for minor versions
- **Major updates:** Quarterly, with staging environment testing
- **Database migrations:** During low-traffic hours (2-5 AM WAT)

## Conclusion

For a 60,000-user MVP, start with a **Hetzner CPX41 (8 vCPU, 16GB RAM)** at approximately **$48/month**. This provides excellent value and performance for the MVP phase while leaving clear scaling paths as the user base grows.

The architecture's microservices design allows for flexible scaling—you can optimize individual services, add servers strategically, or upgrade the entire infrastructure based on actual usage patterns.

**Next Steps:**
1. Provision server and configure base infrastructure
2. Deploy services with PM2 and Nginx
3. Set up monitoring and alerting
4. Run load tests to validate capacity
5. Launch MVP and monitor metrics
6. Scale based on real-world data
