# Appa Baby 👶🍼
### Minimalist Breastfeeding & Pumping Tracker (Nara Baby Clone)

A lightweight, zero-latency, cross-platform baby feeding tracker designed for seamless two-parent synchronization across iOS (Safari PWA) and Android (Chrome PWA on Google Pixel).

---

## Features

- **Dual-Side Nursing Timer (Nara Style):**
  - Independent Left and Right breast timers within a single session.
  - One-tap side switching: Tapping the opposite breast auto-commits the current side and starts the other without losing a second.
  - Background-resilient timing: Calculated dynamically from start timestamps (`now() - start_time`), immune to phone screen shut-offs or browser minimization.
- **Breast Pumping Tracker:**
  - Simultaneous dual pumping or individual side timers.
  - Milk volume entry per side in US Ounces (`oz`) or Milliliters (`ml`) with quick increment chips.
- **Immediate Visual Status:**
  - "Last Breast Fed" guidance badge with relative time (e.g. `Right breast • 2h 15m ago`).
  - Next recommended side indicator (`Next: Left`) so mom knows where to latch.
- **Two-Parent Real-Time Sync:**
  - Pair effortlessly with a shared **Family Code** or secret share link (no passwords or accounts).
  - Live in-progress timer sync over Supabase Realtime: If Mom starts nursing on her iPhone, Dad sees the active timer running live on his Google Pixel.
- **Nara Aesthetic & 3:00 AM UX:**
  - Soothing daytime warm cream / sand neutrals.
  - High-contrast AMOLED `#09090b` dark mode toggle for low-light night feedings.
  - Large touch targets (minimum 64px) with native tactile haptic feedback (`Web Haptics API`).
- **History & Daily Analytics:**
  - Today's summary: Total nursing time, feed count, average feed interval, and pumped milk volume.
  - Reverse chronological timeline grouped by date with full editing and deletion.
- **Offline Durability:**
  - Works immediately out of the box with `localStorage` even without an internet connection or Supabase setup.

---

## Getting Started

### 1. Install & Run Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 2. Supabase Real-Time Backend Setup (Optional)

To enable live cross-device sync between parents:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard and run:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Family Pairing Table
create table public.families (
  id text primary key,
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
  logged_by text not null default 'Mom',
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

-- 4. Active Live Timer State Table
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

-- Enable Realtime
alter publication supabase_realtime add table public.nursing_sessions;
alter publication supabase_realtime add table public.pumping_sessions;
alter publication supabase_realtime add table public.active_timers;

-- Performance Indexes
create index idx_nursing_family_start on public.nursing_sessions (family_id, start_time desc);
create index idx_pumping_family_start on public.pumping_sessions (family_id, start_time desc);
```

3. In `appa-baby`, create a `.env` file or configure via the in-app **Family Sync Modal**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

### 3. Install as PWA on Mobile

- **On iOS (Safari):** Open the deployed URL, tap the **Share** button, and select **Add to Home Screen**.
- **On Android (Google Chrome):** Open the deployed URL, tap the **Menu (⋮)**, and select **Install App** or **Add to Home screen**.
