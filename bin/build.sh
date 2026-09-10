#!/usr/bin/env bash
#
# Production build for the Attendrly application.
#
# Installs production PHP dependencies, builds the frontend bundle with
# Vite Plus, and warms the Laravel caches. Safe to run repeatedly.
#
# Usage:
#   bin/build.sh                 # full production build
#   SKIP_COMPOSER=1 bin/build.sh # skip composer install (deps already vendored)
#   SKIP_NPM=1 bin/build.sh      # skip frontend build
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

say() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
fail() { printf '\033[1;31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

command -v php >/dev/null 2>&1 || fail "php is not installed or not on PATH."

if [[ ! -f composer.json ]]; then
    fail "composer.json not found. Run this script from the project root."
fi

# ---------------------------------------------------------------------------
# PHP dependencies
# ---------------------------------------------------------------------------
if [[ "${SKIP_COMPOSER:-0}" != "1" ]]; then
    command -v composer >/dev/null 2>&1 || fail "composer is not installed or not on PATH."
    say "Installing production PHP dependencies"
    composer install \
        --no-dev \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader \
        --no-progress
else
    say "Skipping composer install (SKIP_COMPOSER=1)"
fi

# ---------------------------------------------------------------------------
# Frontend assets
# ---------------------------------------------------------------------------
if [[ "${SKIP_NPM:-0}" != "1" ]]; then
    command -v npm >/dev/null 2>&1 || fail "npm is not installed or not on PATH."

    if [[ -f package-lock.json ]]; then
        say "Installing Node dependencies (npm ci)"
        npm ci
    else
        say "Installing Node dependencies (npm install)"
        npm install
    fi

    say "Building frontend bundle"
    npm run build
else
    say "Skipping frontend build (SKIP_NPM=1)"
fi

# ---------------------------------------------------------------------------
# Laravel caches
# ---------------------------------------------------------------------------
if [[ ! -f .env && -f .env.example ]]; then
    say "No .env found; copying .env.example"
    cp .env.example .env
fi

if [[ -f .env ]] && ! grep -q '^APP_KEY=base64:' .env; then
    say "Generating application key"
    php artisan key:generate --force
fi

if [[ "${SKIP_CACHE:-0}" != "1" ]]; then
    say "Warming application caches"
    php artisan config:clear >/dev/null 2>&1 || true
    php artisan optimize
fi

say "Build complete."
