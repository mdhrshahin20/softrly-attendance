# Deployment

Attendrly runs on PHP 8.3+ / Laravel 13 with Vite Plus for the frontend.
Two long-running processes are required in production:

| Process | Command | Purpose |
| --- | --- | --- |
| Queue worker | `php artisan queue:work` | Delivers notifications, broadcasts, and mail |
| Reverb | `php artisan reverb:start` | WebSocket server for realtime notifications |
| Scheduler | `php artisan schedule:work` (or cron) | Expires subscriptions, sends billing reminders |

Realtime notifications are queued (`BroadcastEvent` implements `ShouldQueue`),
so the WebSocket server alone is not enough — without a queue worker the bell
never updates.

## Build

```bash
bin/build.sh
```

Installs production Composer dependencies, runs `npm ci` + `npm run build`, and
warms the Laravel caches. Useful flags:

- `SKIP_COMPOSER=1` — dependencies already vendored
- `SKIP_NPM=1` — skip the frontend build
- `SKIP_CACHE=1` — skip `php artisan optimize`

## Deploy

```bash
DEPLOY_HOST=attendrly.com \
DEPLOY_USER=deploy \
DEPLOY_PATH=/var/www/attendrly \
bin/deploy.sh
```

The script builds, rsyncs the release, then on the server: enables maintenance
mode, runs migrations, links storage, warms caches, and restarts the queue and
Reverb workers. Maintenance mode is always lifted, even if a step fails.

- `DRY_RUN=1` — show what rsync would transfer, change nothing
- `SKIP_BUILD=1` — deploy the current working tree
- `SKIP_MIGRATE=1` — skip migrations
- `DEPLOY_SSH_KEY` / `DEPLOY_PORT` — alternate key or port
- `QUEUE_RESTART_CMD` / `REVERB_RESTART_CMD` — override service restarts
  (e.g. `sudo systemctl restart attendrly-queue`)

`.env` and `storage/` are never overwritten by a deploy — they are server-owned.

## GitHub Actions

- `.github/workflows/tests.yml` — CI on push/PR via `composer ci:check`
- `.github/workflows/deploy.yml` — CD on a `v*` tag or manual dispatch

Configure these repository secrets for the deploy workflow:

| Secret | Example |
| --- | --- |
| `DEPLOY_HOST` | `attendrly.com` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PATH` | `/var/www/attendrly` |
| `DEPLOY_SSH_KEY` | private key (PEM) with server access |
| `DEPLOY_PORT` | `22` (optional) |

Without `DEPLOY_HOST` the deploy job skips instead of failing, so forks and PRs
stay green.

## Nginx + Reverb

Proxy the WebSocket endpoint and point the app at it:

```nginx
location /app {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

```dotenv
REVERB_HOST="attendrly.com"
REVERB_PORT=443
REVERB_SCHEME=https
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

## Backups

Create backups from **Platform → Backups**, or per workspace from a tenant's
page. Archives are written to `storage/app/backups` with PDO only — no
`mysqldump` binary required.

Both archive types contain `database.sql` and `manifest.json`:

- **Full site** — every application table (schema + data) plus files under
  `storage/app/public`. Includes `DROP TABLE IF EXISTS` for a true restore.
- **Workspace** — only that tenant's rows. Uses `CREATE TABLE IF NOT EXISTS`, so
  it is additive and will not drop shared tables.

Session, cache, queue, and `backups` tables are always excluded; `migrations`
and platform reference tables are included in full dumps. Restoring is manual
and deliberate — see the notes on the Backups page.

```bash
unzip attendrly-full-*.zip -d restore/
mysql -u USER -p DB_NAME < restore/database.sql
```

`.env` is intentionally **not** included in archives; restore it separately.
