# Login Troubleshooting Checklist

Follow these steps **in order** if admin login is not working.

---

## Step 1: Verify .env.local

Your `.env.local` must have **exactly**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

- Use **Anon Key (Legacy)** from Supabase (Project Settings → API)
- The anon key must start with `eyJ` (it's a JWT)
- Do NOT use the Publishable Key (sb_publishable_...)
- No quotes, no spaces around `=`
- File must be in project root (same folder as package.json)

---

## Step 2: Clear Everything

1. **Stop** the dev server (Ctrl+C)
2. **Delete** the `.next` folder
3. **Clear browser data** for localhost:3000:
   - F12 → Application → Cookies → localhost:3000 → Clear all
   - Application → Local Storage → localhost:3000 → Clear
4. **Restart**: `npm run dev`

---

## Step 3: Supabase Dashboard Checks

### A. Project is Active
- Dashboard → Your project
- If it says **Paused**, click **Restore project**

### B. Email Auth Enabled
- Authentication → **Providers** → **Email**
- Toggle must be **ON** (enabled)

### C. URL Configuration
- Authentication → **URL Configuration**
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: Add `http://localhost:3000/**`
- Click **Save**

### D. User Exists
- Authentication → **Users**
- Your admin user must be listed
- If not, click **Add user** and create one

### E. User is in admin_users Table
- SQL Editor → New query
- Run: `SELECT * FROM admin_users;`
- Must show at least 1 row
- If empty, run (replace with your actual email):
```sql
INSERT INTO admin_users (id) 
SELECT id FROM auth.users WHERE email = 'your-admin@example.com';
```

---

## Step 4: Test Login

1. Open **Incognito/Private** window (to avoid extensions)
2. Go to `http://localhost:3000/admin/login`
3. Enter the **exact** email and password from Supabase Auth
4. Click Sign In

---

## Step 5: What the Login Page Shows Now

- **"Config issue"** yellow box = Wrong key in .env.local (use Anon Key Legacy)
- **"Invalid login credentials"** = Wrong email or password
- **"Invalid Refresh Token"** = Click "Clear session & reload", then try again
- **"Failed to fetch"** = Network issue (VPN, firewall, or Supabase paused)

---

## Step 6: Still Not Working?

1. Open F12 → **Console** when you click Sign In
2. Copy the **exact error message** you see
3. Open F12 → **Network** tab → Clear → Click Sign In
4. Look for a red/failed request → click it → check **Response** tab
5. Share that error for further help
