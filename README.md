# Discord-Wannabe

[![Build Status](https://github.com/KamilPopielarz/Discord-Wannabe/actions/workflows/ci.yml/badge.svg)](https://github.com/KamilPopielarz/Discord-Wannabe/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Project Description

**Discord-Wannabe** is a simple, secure web-based communicator for small groups of friends, with a focus on voice calls and a minimal, user-friendly chat. It enables quick setup of private servers and rooms via unlisted links, optional passwords, and supports emoji, GIF, and link previews. Voice calls are powered by LiveKit (EU) with high-quality audio and permission-based speaking.

## Tech Stack

- **Astro 5** for fast SSR/SSG and island architecture
- **React 19** for interactive components
- **TypeScript 5** for static typing
- **Tailwind CSS 4** with **shadcn/ui** for styling and UI components
- **Supabase** (PostgreSQL, Auth, Realtime, Edge & Scheduled Functions) as Backend-as-a-Service
- **LiveKit Cloud (EU)** for WebRTC/SFU voice calls (STUN/TURN, Opus, QoS telemetry)
- **Cloudflare Turnstile** for CAPTCHA flows
- **Argon2id** for secure room password hashing
- **OpenRouter.ai** (optional MVP) for AI integrations
- **GitHub Actions**, **Docker**, **DigitalOcean** for CI/CD and hosting
- **Sentry** and **LiveKit webhooks** for monitoring and logging

## Getting Started

### Prerequisites

- Node.js v22.14.0 (see `.nvmrc`)
- npm (bundled with Node.js)

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LiveKit
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Cloudflare Turnstile
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# OpenRouter (optional)
OPENROUTER_API_KEY=
```

### Installation & Development

```bash
git clone https://github.com/KamilPopielarz/Discord-Wannabe.git
cd discord-wannabe
npm ci
cp .env.example .env  # or create .env from template
# Fill in .env values
npm run dev
```

Visit `http://localhost:3000` to explore the app.

## Available Scripts

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start development server              |
| `npm run build`    | Build for production                  |
| `npm run preview`  | Preview production build at local URL |
| `npm run lint`     | Run ESLint                            |
| `npm run lint:fix` | Fix ESLint issues                     |
| `npm run format`   | Format code with Prettier             |

## Project Scope

### In Scope (MVP)

- Guest mode (temporary session) and user accounts (email + password, double opt-in)
- Private servers & rooms via unlisted links with optional passwords
- Text chat with emoji, GIF (GIPHY, G/PG-13), and server-generated link previews
- Voice calls (WebRTC/SFU) with LiveKit, speak-by-permission, mute/unmute, device selection
- Role & permission management: Owner, Admin, Moderator, Member, Guest
- Security & privacy: TLS, SRTP, secure httpOnly cookies, Argon2id, SSRF hardening
- Data retention: chat (1 day), logs/audit (90 days)

### Out of Scope (MVP)

- Mobile or native apps
- Message attachments or editing
- Public room directory and search
- End-to-end encryption and call recording
- Advanced moderation automation
- Integrations beyond GIPHY
- Public API

## Project Status

**MVP in active development.** Roadmap and feature priorities are documented in the PRD (`.ai/prd.md`). Contributions are welcome!

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
