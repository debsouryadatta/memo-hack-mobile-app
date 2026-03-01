# MemoHack Monorepo

A Turborepo monorepo containing the MemoHack mobile app, landing page, admin dashboard, and shared Convex backend.

## Structure

```
├── apps/
│   ├── mobile/          # React Native Expo app
│   ├── landing/         # Landing page (React + Vite)
│   └── admin/           # Admin dashboard (React + Vite)
├── packages/
│   └── convex/          # Shared Convex backend
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # PNPM workspaces config
└── turbo.json           # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js 18+
- PNPM 9+

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:mobile    # Mobile app (Expo)
pnpm dev:landing   # Landing page (Vite on port 3000)
pnpm dev:admin     # Admin dashboard (Vite on port 3001)

# Run Convex development server
cd packages/convex && pnpm dev
```

### Build

```bash
# Build all apps
pnpm build
```

## Convex Setup

1. Set up your Convex deployment:

   ```bash
   cd packages/convex
   npx convex dev
   ```

2. Copy the Convex URL to each app's `.env` file:
   - `apps/landing/.env` → `VITE_CONVEX_URL=your_convex_url`
   - `apps/admin/.env` → `VITE_CONVEX_URL=your_convex_url`
   - For mobile app, update the Convex URL in your app configuration

## Apps

### Mobile (`@memo-hack/mobile`)

React Native Expo app with NativeWind styling.

### Landing (`@memo-hack/landing`)

Marketing landing page built with React and Vite.

### Admin (`@memo-hack/admin`)

Admin dashboard for managing content, built with React and Vite.

## Packages

### Convex (`@memo-hack/convex`)

Shared Convex backend with schema, functions, and types.

Import in any app:

```typescript
import { api } from "@memo-hack/convex";
```

## Scripts

| Command      | Description                              |
| ------------ | ---------------------------------------- |
| `pnpm dev`   | Start all apps in development mode       |
| `pnpm build` | Build all apps                           |
| `pnpm lint`  | Lint all apps                            |
| `pnpm clean` | Clean all build outputs and node_modules |
