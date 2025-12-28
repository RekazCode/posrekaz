# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] Copy `.env.production` to `.env`
- [ ] Generate new APP_KEY: `php artisan key:generate`
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Configure correct `APP_URL` with HTTPS
- [ ] Set strong `DB_PASSWORD`
- [ ] Set strong `REDIS_PASSWORD`

### 2. Database
- [ ] Create production database
- [ ] Create database user with minimal permissions
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Run seeders: `php artisan db:seed --force`
- [ ] Verify indexes are created

### 3. Security
- [ ] SSL certificate installed and configured
- [ ] HTTPS enforced
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled
- [ ] Sanctum domains configured
- [ ] Debug mode disabled
- [ ] Error reporting configured (no stack traces)

### 4. Performance
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan view:cache`
- [ ] Run `php artisan optimize`
- [ ] Redis configured for cache/queue
- [ ] OPcache enabled in PHP

### 5. File Permissions
- [ ] `storage/` directory writable (775)
- [ ] `bootstrap/cache/` directory writable (775)
- [ ] Log files writable
- [ ] `.env` file readable only by web user (600)

---

## Deployment Steps

### Initial Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-org/pos-system.git
cd pos-system/backend

# 2. Install dependencies (no dev packages)
composer install --no-dev --optimize-autoloader

# 3. Copy and configure environment
cp .env.production .env
php artisan key:generate

# 4. Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 5. Run migrations and seeders
php artisan migrate --force
php artisan db:seed --force

# 6. Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# 7. Set up queue worker (systemd service)
# See docs/deployment/queue-worker.md

# 8. Configure web server
# See docs/deployment/nginx.md or apache-vhost.conf
```

### Update Deployment

```bash
# 1. Enable maintenance mode
php artisan down --retry=60

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
composer install --no-dev --optimize-autoloader

# 4. Run migrations
php artisan migrate --force

# 5. Clear and rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# 6. Restart queue workers
php artisan queue:restart

# 7. Disable maintenance mode
php artisan up
```

---

## Post-Deployment Verification

### API Health Check
```bash
curl https://your-domain.com/api/health
# Expected: {"success":true,"message":"API is running","timestamp":"..."}
```

### Authentication Test
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Database Connectivity
```bash
php artisan tinker --execute="DB::connection()->getPdo(); echo 'OK';"
```

### Redis Connectivity
```bash
php artisan tinker --execute="Redis::ping(); echo 'OK';"
```

---

## Monitoring

### Log Locations
- Application logs: `storage/logs/laravel.log`
- Queue failed jobs: `php artisan queue:failed`
- Audit logs: Database `audit_logs` table

### Key Metrics to Monitor
- Response times (target: < 200ms)
- Error rate (target: < 0.1%)
- Queue job processing time
- Database connection pool
- Redis memory usage

---

## Rollback Procedure

```bash
# 1. Enable maintenance mode
php artisan down

# 2. Revert to previous release
git checkout <previous-commit>

# 3. Rollback migrations if needed
php artisan migrate:rollback --step=1

# 4. Reinstall dependencies
composer install --no-dev --optimize-autoloader

# 5. Rebuild caches
php artisan config:cache
php artisan route:cache

# 6. Disable maintenance mode
php artisan up
```

---

## Default Credentials

> ⚠️ **CHANGE IMMEDIATELY AFTER DEPLOYMENT**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Cashier | cashier@example.com | password |

---

## Security Contacts

- For security vulnerabilities: security@your-domain.com
- Emergency hotline: +218-XXX-XXXX
