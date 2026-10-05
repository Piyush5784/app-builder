# App Builder

An AI software engineer that builds apps in its own dev environment.
Describe what you want to build, and an agent plans the work, writes code,
runs it, and iterates on real errors — build failures, missing imports,
failed tests — inside an isolated [E2B](https://e2b.dev) sandbox, until it
hands back a working, running application.


<img width="1863" height="1008" alt="Screenshot from 2026-10-05 11-49-12" src="https://github.com/user-attachments/assets/b8b34b2e-cb7e-4083-ae8d-2658ddcb3a8b" />
<img width="1863" height="1008" alt="Screenshot from 2026-10-05 11-50-18" src="https://github.com/user-attachments/assets/643092b0-3379-4989-8edb-962527599f71" />


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
