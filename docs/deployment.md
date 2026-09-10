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

## Face verification

Optional per-workspace check-in verification. Off by default; enable it in
**Settings → Attendance** (requires the `face_verification` plan feature, which
is on Professional and Enterprise).

### How it works

The browser detects the face and extracts a 128-float descriptor using
`@vladmandic/face-api`. **Only the descriptor is sent** — the server compares it
to the enrolled template with plain vector math and decides pass or fail. A
tampered client cannot claim success, because the comparison never happens in
the browser.

### Verification flow

The camera is **only opened on demand** — it is not started when the dashboard
loads, so no permission prompt appears until the employee acts.

1. Employee clicks **Check in** (or **Check out**).
2. The camera panel opens and the employee's face is verified automatically —
   the detection loop waits until a face is held steady (two consecutive
   detections), then matches the descriptor against the stored template via
   `POST /face/verify`.
3. On a match the attendance is submitted automatically. On a mismatch it
   retries a couple of times, then offers **Try again**. **Cancel** closes the
   camera without marking anything.

- **Auto-verification never marks attendance by itself.** The employee clicking
  Check in / Check out is what starts it, and the server verifies again when the
  attendance is actually written.
- Attempts are capped (`MAX_AUTO_ATTEMPTS` in `resources/js/pages/dashboard.tsx`)
  so a bad camera cannot loop against the server.
- `/face/verify` is throttled to 60 requests/minute and has no side effects.
- When a workspace does **not** require face verification, clicking the button
  submits immediately with no camera involved.

### Model assets

The model weights are ~7 MB and are **not committed**. They are copied from
`node_modules/@vladmandic/face-api/model` into `public/models` on every build:

```bash
npm run face:models   # also runs automatically before `npm run build` and `npm run dev`
```

Because `bin/build.sh` calls `npm run build`, a normal deploy handles this. If
you build elsewhere and sync only `public/`, make sure `public/models` is
included — check-in will silently fail to load models without it.

The `face-api` JS chunk is code-split (~330 KB gzipped) and only loads when an
employee enrols or the workspace requires verification, so it costs nothing on
normal pages.

### Data and retention

- Stored per employee: the **descriptor** (a mean of the enrolment samples) and,
  optionally, a small enrolment selfie used only as a human reference.
- Stored per check-in: the match score, the verified timestamp, and — when
  **Keep the check-in selfie** is on — a downscaled frame.
- Selfies live on the **private** disk (`storage/app`, never `public/`) and are
  served through an authenticated route.
- Face data is biometric, so it needs employee consent and a deletion path.
  Employees can view and remove their own data at any time from `/face`, which
  revokes the template immediately.

Back up `storage/app/faces` alongside the database — templates are not portable
without it, and restoring a database without them forces re-enrolment.

### Tuning

`face_match_threshold` defaults to `0.5` (Euclidean distance, lower is
stricter). Typical same-face distance is ~0.3–0.5 and different-face is ~0.7+.
Raise it if genuine employees are rejected; lower it if impostors get through.

Only active liveness detection (blink/turn challenges) defends against a printed
photo or a video replay. That is not implemented — treat this as a strong
deterrent and an audit trail, not as biometric proof of life.

