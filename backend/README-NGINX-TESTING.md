# Nginx Configuration Testing

## Important Note About Testing

When testing nginx configuration with `docker run` outside the Docker network, you will see errors like:
```
host not found in upstream "api-gateway:3000"
```

**This is EXPECTED and NORMAL behavior.** These errors occur because:
1. Nginx resolves upstream hostnames at startup time
2. When testing with `docker run`, there's no Docker network, so container names can't be resolved
3. In production, when nginx runs in the same Docker network as your services, these hostnames resolve correctly

## Testing Methods

### Method 1: Test in Production Network (Recommended)

Test the config when nginx is actually running in the Docker network:

```bash
# Test config syntax (will work if containers are on same network)
docker-compose -f docker-compose.production.yml exec nginx nginx -t

# Or if nginx container is running
docker exec mecabal-nginx nginx -t
```

### Method 2: Test Syntax Only (Ignore DNS Errors)

The configuration syntax is valid even if upstreams can't be resolved:

```bash
# Test will show DNS errors but syntax is valid
docker run --rm \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine nginx -t 2>&1 | grep -v "host not found in upstream"
```

### Method 3: Use Test Script

Run the provided test script:

```bash
./test-nginx-config.sh
```

This script:
- Checks syntax structure
- Validates brace balance
- Checks for duplicate server names
- Verifies required directives
- Explains that DNS errors are expected

### Method 4: Test in Actual Network Context

Create a temporary network with dummy containers:

```bash
# Create test network
docker network create test-network

# Start dummy containers (optional, just to test resolution)
docker run -d --name test-api-gateway --network test-network nginx:alpine
docker run -d --name test-web-app --network test-network nginx:alpine

# Test nginx config in the network
docker run --rm \
  --network test-network \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine nginx -t

# Cleanup
docker stop test-api-gateway test-web-app
docker rm test-api-gateway test-web-app
docker network rm test-network
```

## Production Deployment

In production, when nginx runs in the `mecabal-network` with all services:

1. All upstream hostnames resolve correctly
2. Nginx starts successfully
3. All services are accessible

## Quick Validation Checklist

Before deploying to production, verify:

- [ ] Config file exists: `nginx.conf`
- [ ] Braces are balanced (use test script)
- [ ] No duplicate `server_name` entries
- [ ] SSL certificate paths are correct (if using HTTPS)
- [ ] All required upstreams are defined
- [ ] Resolver directive is present (for dynamic resolution)

## Common Issues

### Issue: "host not found in upstream"
**Solution**: This is expected when testing outside Docker network. Will work in production.

### Issue: "SSL certificate not found"
**Solution**: Ensure SSL certificates exist at specified paths, or temporarily disable SSL for testing.

### Issue: "duplicate server_name"
**Solution**: Check for multiple server blocks with the same `server_name`.

### Issue: "syntax error"
**Solution**: Check for missing semicolons, unclosed braces, or typos in directives.

