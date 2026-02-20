# HostFlow

HostFlow is a simple restaurant waitlist system with a host dashboard and a guest sign-up experience.

## Quick start

1. Copy the environment template and fill in your Supabase project values.

```bash
copy .env.local.example .env.local
```

2. Install dependencies and run the app.

```bash
npm install
npm run dev
```

## App routes

- `/` Landing page
- `/login` Staff login
- `/mode/[slug]` Device mode selector after login
- `/host/[slug]` Host dashboard (example: `/host/joespizza`)
- `/kiosk/[slug]` Guest kiosk sign-up (example: `/kiosk/joespizza`)
- `/join/[slug]` Guest sign-up for QR links
- `/join/[slug]/status?partyId=...` Live status screen

## Supabase setup

You need Supabase Auth and a `parties` table with realtime enabled.

Suggested schema for `parties`:

```
id uuid primary key default gen_random_uuid()
restaurant_slug text not null
name text not null
size integer not null
phone text
notes text
status text not null
created_at timestamptz not null default now()
```

## Build

```bash
npm run build
```
