# App Builder

An AI software engineer that builds apps in its own dev environment.

Describe what you want to build, and an agent plans the work, writes code, runs it, and iterates on real errors — build failures, missing imports, failed tests — inside an isolated E2B sandbox, until it hands back a working, running application.

Live Link: https://web-builder.space

## Demo

[Demo Video](https://res.cloudinary.com/dzf9kamfw/video/upload/v1785883102/cursorful-video-aug5_l7gzcw.mp4)

<img width="1858" height="1010" alt="Screenshot from 2026-09-13 22-34-45" src="https://github.com/user-attachments/assets/e0261b98-6ceb-4dc0-a66c-9c5c86eb7848" />
<img width="1858" height="1010" alt="Screenshot from 2026-09-13 22-37-13" src="https://github.com/user-attachments/assets/56be305f-7e5c-416d-bdae-dbec089fc1a5" />
<img width="1858" height="1010" alt="Screenshot from 2026-09-13 22-38-04" src="https://github.com/user-attachments/assets/fccf3959-441f-4baa-a995-80762b36ccfd" />

## How It Works

1. **Describe** what you want to build in plain language.
2. **Plan** — the agent breaks the request into concrete steps.
3. **Build** — it writes and edits files, and runs commands inside an isolated E2B cloud sandbox.
4. **Iterate** — build failures, missing imports, and failed tests are fed back to the agent, which keeps fixing and re-running until things pass.
5. **Preview** — the running app is streamed back live so you can watch it take shape, step by step, and edit it further.

## Features

- **Agentic build loop** — the agent doesn't just generate code once; it runs it, reads the actual errors, and self-corrects until the app works.
- **Isolated sandboxes** — every build runs in its own on-demand E2B sandbox, so nothing touches your local machine.
- **Live streaming** — every step (planning, file writes, command output) streams to the UI in real time.
- **Cost-aware infrastructure** — sandboxes spin up only for real build/file actions, keeping idle chat interactions free.

## Tech Stack

- [Bun](https://bun.sh) – runtime
- [Turborepo](https://turbo.build) – monorepo
- [TypeScript](https://www.typescriptlang.org) – language
- [React](https://react.dev) – framework
- [Vite](https://vite.dev) – build tool
- [TanStack Router](https://tanstack.com/router) – routing
- [TanStack Query](https://tanstack.com/query) – data fetching
- [Tailwind](https://tailwindcss.com) – CSS
- [Base UI](https://base-ui.com) – components
- [Express](https://expressjs.com) – backend framework
- [ZenStack](https://zenstack.dev) – ORM toolkit
- [Prisma](https://www.prisma.io) – ORM
- [Neon](https://neon.tech) – database
- [better-auth](https://www.better-auth.com) – auth
- [Upstash](https://upstash.com) – redis
- [Resend](https://resend.com) – emails
- [E2B](https://e2b.dev) – sandboxes
- [Zod](https://zod.dev) – validation

## Deployment

- [Cloudflare Pages](https://pages.cloudflare.com) – frontend hosting
- [AWS EC2](https://aws.amazon.com/ec2) – backend hosting
- [AWS SSM Parameter Store](https://aws.amazon.com/systems-manager/features/#Parameter_Store) – secrets
- [Caddy](https://caddyserver.com) – reverse proxy / TLS
- [pm2](https://pm2.keymetrics.io) – process manager
- [GitHub Actions](https://github.com/features/actions) – CI/CD
