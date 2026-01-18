# KNX Smart Home Landing Page

## Overview

This is a landing page application for a KNX home automation business targeting the Lithuanian market. The application features a public-facing marketing site with pricing plans, feature comparisons, and lead capture functionality, along with an admin panel for managing content. The site is built to showcase KNX smart home automation packages with configurable pricing options.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **Component Library**: shadcn/ui (Radix UI primitives with custom styling)
- **Build Tool**: Vite with React plugin
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a component-based architecture with:
- `/client/src/pages/` - Page components (landing, admin, 404)
- `/client/src/components/` - Reusable UI components
- `/client/src/components/landing/` - Landing page specific sections
- `/client/src/components/ui/` - shadcn/ui component library
- `/client/src/hooks/` - Custom React hooks
- `/client/src/lib/` - Utility functions and API client

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Build**: esbuild for production bundling with selective dependency bundling

The backend structure:
- `/server/index.ts` - Express app setup and middleware
- `/server/routes.ts` - API route definitions
- `/server/storage.ts` - Data access layer with interface abstraction
- `/server/db.ts` - Database connection (Drizzle ORM with PostgreSQL)
- `/server/email.ts` - Email service integration (Resend)

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `/shared/schema.ts` - Shared between frontend and backend
- **Migrations**: Drizzle Kit with push-based migrations (`db:push`)

Key database tables:
- `plans` - Pricing plan definitions
- `options` / `option_groups` - Configurable add-ons and quantities
- `plan_option_groups` - Junction table linking specific option groups to plans (plan-specific pricing options)
- `features` / `feature_groups` / `plan_features` - Feature comparison matrix
- `site_content` - CMS-style content blocks
- `content_blocks` - Custom content sections with optional slug for anchor navigation
- `menu_links` - Customizable header menu with section/URL targeting
- `leads` - Lead capture form submissions
- `users` / `sessions` - Authentication (Replit Auth)

### Authentication (Dual System)
- **Development**: Replit Auth (OpenID Connect) - works automatically when REPL_ID is set
- **Production**: Password-based authentication via ADMIN_USERNAME and ADMIN_PASSWORD env vars
- **Session Storage**: PostgreSQL via connect-pg-simple
- **Pattern**: Session-based with Passport.js (for Replit Auth) or custom session for password auth
- Protected routes use `isAuthenticated` middleware (supports both auth methods)
- Admin login page: `/admin/login` (for password-based auth)

### Shared Code Pattern
The `/shared/` directory contains code used by both frontend and backend:
- Schema definitions with Drizzle ORM
- Zod validation schemas (generated from Drizzle schemas)
- TypeScript types inferred from schemas

## External Dependencies

### Third-Party Services
- **Database**: PostgreSQL (provisioned via Replit)
- **Email**: Resend API for transactional emails (lead notifications)
- **Authentication**: Replit OpenID Connect

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `express` / `express-session` - HTTP server and sessions
- `@tanstack/react-query` - Server state management
- `react-hook-form` / `@hookform/resolvers` - Form handling
- `zod` / `drizzle-zod` - Runtime validation
- `resend` - Email delivery
- `passport` / `openid-client` - Authentication

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `REPL_ID` - Replit environment identifier (auto-set by Replit, enables Replit Auth)
- `ADMIN_USERNAME` - Admin username for password auth (production)
- `ADMIN_PASSWORD` - Admin password for password auth (production)
- Resend credentials via Replit Connectors

## Recent Changes

### Footer Menu & Custom Pages System (January 2026)
- Added `footerLinks` table for admin-manageable footer navigation
- Added `customPages` table for creating pages like Privacy Policy, Terms
- Admin pages: `/admin/footer-links` and `/admin/pages`
- Dynamic page routing: `/:slug` displays custom pages
- Footer component now fetches links from database

### Deployment Configuration
- Added `Dockerfile` for container deployment
- Added `DEPLOYMENT.md` with instructions for Hostinger VPS + Coolify
- Target domain: namosistemos.lt

### Dual Authentication System (January 2026)
- Added password-based authentication for production environments
- Login page at `/admin/login` for environments without Replit Auth
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in Coolify for production access
- System automatically detects which auth method to use based on available env vars
- Both methods share the same session storage (PostgreSQL)