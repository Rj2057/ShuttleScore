# ShuttleScore Badminton Tournament – Season 2

Real-time live scoreboard for a badminton tournament. **100–200 viewers** can watch scores update instantly with no login. Admins log in to manage matches, scores, and brackets.

---

## Tech Stack

| Layer       | Technology   |
|------------|--------------|
| Frontend   | Next.js 14, Tailwind CSS |
| Database   | Supabase (PostgreSQL)    |
| Auth       | Supabase Auth            |
| Real-time  | Supabase Realtime        |
| Hosting    | Vercel (recommended)     |

---

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` public key

### 2. Run Database Migration

1. In Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy its contents and run in the SQL Editor

### 3. Add First Admin

1. Supabase Dashboard → **Authentication → Users → Add user**
2. Create a user with email and password (e.g. `admin@yourdomain.com`)
3. In **SQL Editor**, run (replace with your admin email):

```sql
INSERT INTO admin_users (id) 
SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com';
```

### 4. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Public (no login)

- **Live Scoreboard** (`/live`) – real-time scores
- Group matches, quarter finals, semi finals, final
- Updates appear in under ~100ms

### Admin

- **Login** (`/admin/login`) – use the admin email/password
- **Tournament** – create tournament, groups, knockout bracket
- **Teams** – add groups (A, B, C, D) and teams
- **Matches** – edit scores, set status (Scheduled/Live/Completed), set winner

### TBD auto-progression

When you set a winner on a knockout match, the **next match’s TBD slot is filled automatically** (database trigger). No manual linking needed.

---

## Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Real-time Limits

- **Supabase Free**: 200 concurrent real-time connections
- **Pro**: 500 concurrent connections

100–200 viewers fits within the free tier.
