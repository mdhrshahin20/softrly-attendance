# Backend & Architecture Tastes

- Prefers a domain/module-structured Laravel app (e.g., app/Domain/<Module> with Actions, DTOs, Enums, Events, Jobs, Services, Policies) and a service layer that keeps business logic out of controllers. Confidence: 0.85
- Endorses Spatie packages: Laravel Multitenancy for tenancy and Laravel Permission with granular permissions (e.g., employee.view, leave.approve) instead of coarse role-only checks; backend authorization remains authoritative. Confidence: 0.8
- Treats tenant isolation as a hard rule: every tenant-owned query stays tenant-scoped, and cache/queue/filesystem must not leak between tenants; single-database tenancy is preferred for the MVP. Confidence: 0.85
- Prefers dynamic, data-driven plans/subscriptions (platform admin can create and edit plans in-app) instead of fixed hardcoded plan definitions; feature flags and plan limits gate access. Confidence: 0.8
- Prefers pluggable, multi-provider integrations manageable in the admin UI: multiple payment gateways (SSLCommerz, bKash, Stripe, etc.) enabled simultaneously, plus SMS gateways and email providers (SMTP, Amazon SES, Brevo), each with its own live/sandbox config. Confidence: 0.85
- Attendance check-in/out must be gated by approved office network via dedicated middleware/service logic (IP/CIDR matching with proxy-aware client IP handling) rather than scattered controller code. Confidence: 0.7
- Prefers versioned APIs (/api/v1) to keep a future mobile app feasible. Confidence: 0.6
- Prefers queueing heavy work (exports, notifications) with tenant context preserved, Redis for cache/session/queue/rate limiting, and a scheduler for reminders and rollups. Confidence: 0.7
- Wants notifications delivered in realtime (broadcast/WebSocket to the browser) rather than pull-only, and scoped by audience: platform-level events (new signups, payments, expiries/overdue invoices) go to platform admins, tenant-level events (billing, leave, etc.) go to tenant owners/admins. Confidence: 0.6
- Wants the platform-admin area to double as an operations/monitoring console: cross-tenant audit log of admin actions, server/app log viewing, cache/storage/queue maintenance, and system health diagnostics surfaced (e.g. on the dashboard). Confidence: 0.6
- Maintenance/ops controls exposed in the admin UI should be safe and allow-listed with read-only diagnostics — no running migrations/seeders or other destructive schema operations from the browser. Confidence: 0.55
- Wants subscription/billing lifecycle emails fully automated on a schedule (sent idempotently, once per event) and configurable from platform settings (enable/disable plus day thresholds), rather than hardcoded. Confidence: 0.55
