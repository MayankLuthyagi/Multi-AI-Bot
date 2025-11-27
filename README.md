
# Multi-AI-Bot

This project is a multi-provider AI chatbot platform built with [Next.js](https://nextjs.org) and TypeScript. It enables users to interact with various AI providers, manage chat sessions, track token usage, view provider statistics, and access coin price/history data. The platform includes authentication, an admin panel, dashboard, profile, and stats pages, with reusable UI components.

---

## Features

- **Multi-provider AI chatbot**: Connects to different AI providers for chat functionality.
- **Authentication**: User login/logout and session management.
- **Chat Sessions**: Stores and manages user chat histories.
- **Token Usage Tracking**: Monitors and analyzes token usage for cost management.
- **Provider Statistics**: Displays usage and performance stats for each provider.
- **Coin Price/History**: Shows cryptocurrency price and history data.
- **Admin Panel**: Tools for managing users, providers, and costs.
- **Dashboard/Profile/Stats Pages**: User-centric pages for data and settings.
- **Reusable Components**: Includes LoginModal, navbar, SideMenu, ProviderStats, etc.

---

## Technologies & Tools

- **Next.js** (React framework)
- **TypeScript**
- **PostCSS**
- **ESLint**
- **Geist Font** (via next/font)
- **Modular API routes** (for chat, sessions, coins, providers, stats, etc.)

---

## Project Structure

- `src/app/` – Main app pages and API routes
  - `globals.css`, `layout.tsx`, `page.tsx` – Global styles and main layout
  - `admin/panel/` – Admin panel features
  - `api/` – Modular API routes for authentication, chat, sessions, coins, modals, providers, stats, token usage
  - `dashboard/`, `info/`, `profile/`, `stats/` – User-facing pages
- `src/components/` – UI components (LoginModal, navbar, SideMenu, ProviderStats)
- `src/lib/` – Database, session, token counter, and models
- `public/` – Static assets (e.g., logo)
- `scripts/` – Project scripts
- `package.json`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` – Configuration files

---

## Getting Started

1. Install dependencies:
	```bash
	npm install
	```
2. Run the development server:
	```bash
	npm run dev
	```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

Deploy easily on [Vercel](https://vercel.com/) using Next.js deployment documentation.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

---

If you need a custom README or want to add more details, feel free to update this file!
