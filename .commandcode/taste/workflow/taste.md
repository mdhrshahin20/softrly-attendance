# Workflow & Communication Tastes

- The user's environment exports `NODE_ENV=production`, which makes npm/pnpm silently skip devDependencies — installs/dev/builds must run with `NODE_ENV=development` (or unset); "command not found" for dev binaries (e.g., `vp`) is the telltale symptom of dev deps being omitted. Confidence: 0.7
- User prefers npm as the project's package manager and expects plain `npm install` / `npm run dev` to work. If a tool (e.g., `vp migrate`) rewires the repo to pnpm-only syntax (`catalog:` refs, `devEngines` pinning pnpm), revert it to npm-compatible equivalents — npm aliases (e.g., `"vite": "npm:@scope/pkg@ver"`), drop `devEngines`, and `.npmrc` with `legacy-peer-deps=true` (+ explicitly add peers like `@babel/core` that npm then skips). Confidence: 0.7

- Prefers phased, incremental execution that follows an agreed roadmap ("now Phase 2/3/4") and expects the app to be verified working after each phase (routes, forms, navigation, responsive) before moving on. Confidence: 0.8
- Wants the agent to act autonomously: inspect the project, make a plan, and implement without waiting for step-by-step confirmation, and to make professional design decisions itself ("do not ask me to specify every color, spacing, or component"). Confidence: 0.9
- Frontend/refactor work must never break existing backend logic, routes, API contracts, permissions, or tenant isolation; avoids unnecessary rewrites of working architecture and unnecessary new dependencies. Confidence: 0.9
- Iterates with short, rapid feedback messages (often duplicated) during an active session and expects immediate targeted fixes on the last reported issue rather than broad rewrites or re-explanation. Confidence: 0.7
- Values a full end-to-end QA pass ("as Senior QA, check that everything is working") before work is considered done. Confidence: 0.6
- A redesign/refactor must be full-scope: do not stop after the flagship page — every page of the product must be brought onto the same design system, with a final visual audit of all major pages (alignment, spacing, type scale, color consistency, component consistency, responsive behavior, state coverage) before finishing. Confidence: 0.75
