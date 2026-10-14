# appa-baby: Breastfeeding & Pumping Tracker (Nara Baby Clone)
## Architecture & Implementation Plan

A lightweight, zero-latency, cross-platform baby feeding tracker modeled on **Nara Baby**, focusing strictly on **breastfeeding and pumping**. Built for seamless real-time two-parent synchronization across iOS (Safari PWA) and Android (Chrome PWA on Google Pixel).

---

## 1. System Overview & Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript + Vite | Fast build times, tiny bundle size, declarative UI state for synchronized dual-timers. |
| **Styling & Design System** | Tailwind CSS + Lucide Icons | Nara-inspired warm minimalist aesthetic by day (warm stone/sand neutrals) + true AMOLED dark mode (`#09090b`) for 3:00 AM feedings. |
| **App Model** | Progressive Web App (PWA) | Runs full-screen on both iOS and Android via "Add to Home Screen"; no app store fees or provisioning hassle. |
| **Backend & Real-Time Sync** | Supabase (PostgreSQL + Realtime) | Instant WebSocket CDC (Change Data Capture) synchronization on free tier; live in-progress timer sync between devices. |
| **Pairing & Authentication** | Shared Family Code / Secret Link | Zero-friction setup; no password or login wall for parents. |
| **Haptics & Device UX** | Web Haptics API (`navigator.vibrate`) | Tactile feedback on timer tap and side switch without needing to look at the screen. |
| **Deployment** | Vercel or Cloudflare Pages | Edge deployment, automatic SSL, instant Git deployments. |

---

## 2. Core Functional Requirements

### Breastfeeding Session Tracker (Dual-Side Nara Style)
- **Independent Dual Timer:** Left and Right breast timers run independently within a single session.
- **One-Tap Side Switching:** Tapping the opposite breast automatically logs/pauses the current breast and starts the other, updating elapsed seconds on both sides.
- **Session Duration:** Total session time calculated dynamically from timestamps (`now() - side_start_time + accumulated_seconds`) to remain immune to phone sleep / tab backgrounding.
- **Live Cross-Device Timer Sync:** When Mom starts nursing on Left breast, Dad's phone updates in real-time to show the live timer running, elapsed duration, and active side.
- **Manual Logging:** Option to log past nursing sessions manually with start time, end time, and Left/Right duration splits.
- **"Next Side" Guidance:** Prominent badge showing which breast was nursed last and recommending which side to start on next.
- **Interval Counter:** Live badge displaying "Time since last feed started" (e.g., `2h 15m ago`).

### Breast Pumping Tracker
- **Dual / Single Pumping Timer:** Track pumping duration per side (Left, Right, or Both simultaneously).
- **Volume Logging:** Left and Right output amounts with US Ounces (`oz`) default and Milliliters (`ml`) toggle.
- **Manual Pumping Log:** Quick entry of pumping sessions with duration and volume splits.

### Nursing & Pumping Timeline & Analytics
- **Reverse Chronological Log:** Grouped by day with clear visual tags (`Nursing` vs `Pumping`), duration splits (`L: 12m`, `R: 15m`), and volume (`4.5 oz`).
- **Edit & Delete:** Full editing of timestamps, durations, and notes.
- **Daily Summaries:** Daily totals for nursing duration, session count, average interval between feeds, and total pumped volume.

### 3:00 AM Sleep-Deprived UX
- **Warm Minimalist / AMOLED Dark Mode:** Soothing daytime neutrals with auto or toggleable true-black `#09090b` night mode to preserve night vision and melatonin.
- **Large Touch Targets:** Minimum 64px tap targets for Left/Right buttons.
- **Tactile Haptic Confirmation:** Subtle haptic feedback when toggling sides, pausing, or completing sessions.

---

## 3. Database Schema (Supabase SQL)

Run this migration script in the Supabase SQL editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Family Pairing Table
create table public.families (
  id text primary key, -- e.g., friendly code like 'appa-789' or random uuid
  created_at timestamptz not null default now()
);

-- 2. Completed Nursing Sessions Table
create table public.nursing_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id text not null references public.families(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz not null default now(),
  left_duration_seconds integer not null default 0,
  right_duration_seconds integer not null default 0,
  last_side text check (last_side in ('left', 'right')),
  logged_by text not null default 'Mom', -- 'Mom', 'Dad', etc.
  notes text,
  created_at timestamptz not null default now()
);

-- 3. Completed Pumping Sessions Table
create table public.pumping_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id text not null references public.families(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz not null default now(),
  left_duration_seconds integer not null default 0,
  right_duration_seconds integer not null default 0,
  left_amount numeric(5, 2) not null default 0,
  right_amount numeric(5, 2) not null default 0,
  unit text not null default 'oz' check (unit in ('oz', 'ml')),
  logged_by text not null default 'Mom',
  notes text,
  created_at timestamptz not null default now()
);

-- 4. Active Live Timer State Table (Synchronizes in-progress sessions across parents)
create table public.active_timers (
  family_id text primary key references public.families(id) on delete cascade,
  session_type text not null check (session_type in ('nursing', 'pumping')),
  status text not null check (status in ('running', 'paused', 'idle')),
  active_side text not null check (active_side in ('left', 'right', 'both', 'none')),
  left_duration_seconds integer not null default 0,
  right_duration_seconds integer not null default 0,
  side_start_time timestamptz,
  session_start_time timestamptz,
  logged_by text not null default 'Mom',
  updated_at timestamptz not null default now()
);

-- Realtime Publication
alter publication supabase_realtime add table public.nursing_sessions;
alter publication supabase_realtime add table public.pumping_sessions;
alter publication supabase_realtime add table public.active_timers;

-- Performance Indexes
create index idx_nursing_family_start on public.nursing_sessions (family_id, start_time desc);
create index idx_pumping_family_start on public.pumping_sessions (family_id, start_time desc);
```

---

## 4. PWA Configuration

### `manifest.json`
Place in `/public/manifest.json`:

```json
{
  "name": "Appa Baby - Breastfeeding Tracker",
  "short_name": "Appa Baby",
  "description": "Real-time shared breastfeeding and pumping tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### iOS Safari Meta Tags (`index.html`)
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Appa Baby" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
```

---

## 5. Implementation Milestones

### Phase 1: Local Foundation & Nara UI
1. Scaffold Vite + React + TypeScript + Tailwind CSS project.
2. Build Nara-style dual nursing timer with instant Left/Right switching, pause, and accurate background-resilient timestamp tracking.
3. Build pumping session timer with volume inputs (`oz`/`ml` toggle).
4. Implement "Last fed" status widget, interval timer, and daily timeline with edit/delete.
5. Add local persistence via `localStorage` with offline capability and Haptic feedback.

### Phase 2: Supabase Integration & Live Sync
1. Configure Supabase client and apply SQL schema for `families`, `nursing_sessions`, `pumping_sessions`, and `active_timers`.
2. Implement Family Code pairing dialog (generate code / join via code or shared URL).
3. Connect live in-progress timer sync over Supabase Realtime channel.
4. Sync completed sessions and changes in real time across iOS and Android PWAs.

### Phase 3: PWA Installation & Polishing
1. Configure PWA manifest, service worker for offline caching, and responsive mobile viewport optimizations.
2. Deploy to Vercel/Cloudflare.
3. Add to Home Screen on iOS Safari and Google Pixel Chrome.