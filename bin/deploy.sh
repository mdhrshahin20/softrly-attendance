#!/usr/bin/env bash
#
# Deploy Attendrly to a server over SSH/rsync.
#
# Builds locally (unless SKIP_BUILD=1), syncs the release, then runs the
# remote release steps: maintenance mode, migrations, cache warm-up,
# storage link, and worker restarts.
#
# Required environment:
#   DEPLOY_HOST   e.g. attendrly.com
#   DEPLOY_USER   e.g. forge / deploy
#   DEPLOY_PATH   e.g. /var/www/attendrly
#
# Optional:
#   DEPLOY_PORT      SSH port (default 22)
#   DEPLOY_SSH_KEY   Path to a private key (default: ssh agent / ~/.ssh)
#   SKIP_BUILD=1     Do not build before syncing
#   SKIP_MIGRATE=1   Do not run migrations on the server
#   DRY_RUN=1        Show what rsync would transfer, change nothing
#   QUEUE_RESTART_CMD / REVERB_RESTART_CMD  Override service restarts
#
# Example:
#   DEPLOY_HOST=attendrly.com DEPLOY_USER=deploy \
#   DEPLOY_PATH=/var/www/attendrly bin/deploy.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

say() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
fail() { printf '\033[1;31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"

DEPLOY_PORT="${DEPLOY_PORT:-22}"
DRY_RUN="${DRY_RUN:-0}"

SSH_OPTS=(-p "$DEPLOY_PORT" -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
    [[ -f "$DEPLOY_SSH_KEY" ]] || fail "DEPLOY_SSH_KEY not found: $DEPLOY_SSH_KEY"
    SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
ssh_remote() { ssh "${SSH_OPTS[@]}" "$REMOTE" "$@"; }

# ---------------------------------------------------------------------------
# 1. Build locally
# ---------------------------------------------------------------------------
if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
    say "Building release"
    "$ROOT/bin/build.sh"
else
    say "Skipping build (SKIP_BUILD=1)"
fi

[[ -d public/build ]] || fail "public/build is missing. Run bin/build.sh before deploying."

# ---------------------------------------------------------------------------
# 2. Sync files
# ---------------------------------------------------------------------------
RSYNC_ARGS=(
    -az
    --delete
    --human-readable
    # Never overwrite server-owned state.
    --exclude '.env'
    --exclude '.env.*'
    --exclude 'storage/'
    --exclude 'node_modules/'
    --exclude '.git/'
    --exclude '.github/'
    --exclude 'tests/'
    --exclude '.idea/'
    --exclude '.vscode/'
    --exclude 'database/database.sqlite'
)

if [[ "$DRY_RUN" == "1" ]]; then
    say "Dry run: showing what would change"
    RSYNC_ARGS+=(--dry-run --itemize-changes)
fi
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
    RSYNC_ARGS+=(-e "ssh -p ${DEPLOY_PORT} -i ${DEPLOY_SSH_KEY} -o StrictHostKeyChecking=accept-new")
else
    RSYNC_ARGS+=(-e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=accept-new")
fi

say "Syncing release to ${REMOTE}:${DEPLOY_PATH}"
rsync "${RSYNC_ARGS[@]}" "$ROOT/" "${REMOTE}:${DEPLOY_PATH}/"

if [[ "$DRY_RUN" == "1" ]]; then
    say "Dry run complete — no changes were made."
    exit 0
fi

# ---------------------------------------------------------------------------
# 3. Remote release steps
# ---------------------------------------------------------------------------
say "Running remote release steps"

MIGRATE_CMD="php artisan migrate --force"
[[ "${SKIP_MIGRATE:-0}" == "1" ]] && MIGRATE_CMD="echo 'Skipping migrations (SKIP_MIGRATE=1)'"

QUEUE_RESTART_CMD="${QUEUE_RESTART_CMD:-php artisan queue:restart}"
REVERB_RESTART_CMD="${REVERB_RESTART_CMD:-php artisan reverb:restart}"

ssh_remote bash -s <<REMOTE_SCRIPT
set -euo pipefail
cd "$DEPLOY_PATH"

echo "--> Enabling maintenance mode"
php artisan down --render="errors::503" --retry=15 || php artisan down || true

# Always bring the site back up, even if a step below fails.
restore() {
    echo "--> Disabling maintenance mode"
    php artisan up || true
}
trap restore EXIT

echo "--> Running migrations"
$MIGRATE_CMD

echo "--> Linking storage"
php artisan storage:link || true

echo "--> Warming caches"
php artisan optimize

echo "--> Restarting queue workers"
$QUEUE_RESTART_CMD || true

echo "--> Restarting Reverb"
$REVERB_RESTART_CMD || true
REMOTE_SCRIPT

say "Deployment complete."
