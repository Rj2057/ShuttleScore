# ShuttleScore Badminton Tournament – Season 2
## Technical Architecture & Plan

---

## 🎯 Requirements Summary

| Requirement | Solution |
|-------------|----------|
| Admin: Login, score editing, management | Protected admin routes + Supabase Auth |
| Public: View scores without login | Public routes, real-time subscriptions |
| 100-200 real-time viewers | Supabase Realtime (200 conn free, 500 on Pro) |
| Group stage + Knockout (QF, SF, Final) | Flexible bracket schema with stage types |
| TBD auto-progression | Database triggers + winner propagation logic |
| Fast, fault-tolerant | Next.js SSR, Supabase edge, optimistic updates |

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Next.js 14 (App Router) | SSR, great UX, Vercel deployment |
| **Styling** | Tailwind CSS | Fast, responsive, tournament-ready UI |
| **Database** | Supabase (PostgreSQL) | Real-time, auth, RLS, free tier |
| **Auth** | Supabase Auth | Email/password admin login |
| **Real-time** | Supabase Realtime | WebSocket-based, sub-100ms updates |
| **Hosting** | Vercel | Fast, scalable, free for hobby |

---

## 📊 Database Schema

```
tournaments          → Season config, name, dates
groups               → Group A, B, C, D (group stage)
teams                → Team name, group_id
matches              → stage, team1_id, team2_id, score1, score2, winner_id, status
match_scores         → (optional) point-by-point if needed
admin_users          → Links Supabase auth to admin role
```

### Match Stages
- `group` — Group stage
- `quarter` — Quarter final
- `semi` — Semi final  
- `final` — Final

### TBD Auto-Progression
- Group matches: manual (you add teams)
- Knockout: `team1_id`/`team2_id` start as TBD
- When a preceding match gets `winner_id` set, a DB trigger or app logic updates the next match’s TBD slot with that winner

---

## 🔄 Real-time Flow

1. Public page subscribes to `matches` (and optionally `teams`) changes.
2. Admin updates score → `matches` row updated.
3. Supabase broadcasts change to all subscribed clients.
4. UI re-renders with new score in &lt; 100ms.

---

## 📁 Project Structure

```
/app
  /admin           → Protected admin routes
  /(public)        → Live scoreboard, matches, groups
  /api             → API routes if needed
/components        → Scoreboard, MatchCard, Bracket, etc.
/lib               → Supabase client, hooks, utils
/types             → TypeScript types
```

---

## ✅ Pre-Build Checklist

- [ ] Supabase project created
- [ ] Environment variables set
- [ ] Admin user created via Supabase Auth
- [ ] RLS policies configured
