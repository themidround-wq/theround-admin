# the round — Admin

Founder dashboard for the round. Next.js 16 (App Router) on top of the `/api/admin` endpoints in `theround-service`. It replaces the single-file mockup in `../the-round-admin-dashboard`.

## Pages

| Page | What you can do |
| --- | --- |
| **Overview** | Waitlist, accounts, saved rounds and weekly actives with week-over-week change; daily chart (7/14/30/90 days); waitlist → practice funnel; latest signups. |
| **Waitlist** | Search, filter (not invited / invited / has account), bulk-send the launch invite email, add emails by hand, remove, export CSV. |
| **Users** | Search and filter by status and stage. Each user has a profile, stats and every round; suspend/restore or delete (removes their recordings too). |
| **Practice** | Spin → save funnel, saved rounds per day, category mix, reflections; every round with filters, play recording, delete. |
| **Newsletters** | Write newsletters, feature updates, announcements and maintenance notices in a WYSIWYG editor with live email preview and autosave. Pick an audience (users, segments, waitlist), send a test, schedule or send now, then follow delivery per recipient and retry failures. Manage unsubscribes. |
| **Clinical content** | Wheel categories (reorder, rename, hide, delete), topics and questions (add, edit, delete). Anything already practised can't be deleted, only edited or hidden. |
| **Team** | Owners add people, set roles (viewer / admin / owner), reset passwords, remove access. |
| **Audit log** | Every change, sign-in and recording played, filterable by area. |
| **Settings** | Waitlist open/closed, new sign-ups on/off, default response time, automatic emails on/off; your name, password and active sessions. |

Brand (colours, Satoshi, logo, cut-corner button) comes from the landing page in `../theround`.

## Run

```bash
cp .env.example .env.local   # point THEROUND_API_URL at theround-service, including /api
npm install
npm run dev                  # http://localhost:3001 (the service uses 3000)
```

Sign in with the owner account the service creates on first boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (see the service README). Add everyone else from **Team**.

## How auth works

- `POST /api/admin/auth/login` returns a 12-hour token tied to a session row. It's stored in an httpOnly `tr_admin` cookie and only ever sent server-to-server, so the browser never sees the API.
- `proxy.ts` sends anyone without the cookie to `/login`. The API checks the token on every call; a 401 (expired, signed out elsewhere, access removed) sends the admin back to `/login`.
- Sign out revokes the session on the API, then clears the cookie.
- **Two-factor:** turn it on under Settings → Two-factor authentication (QR code for Google Authenticator or any TOTP app, then 10 recovery codes to save). After that, sign-in asks for a 6-digit code after the password; "Lost your phone?" accepts a recovery code. Everyone without 2FA sees a reminder banner.
- **Forgot password:** the link under the password field emails a single-use reset link (30 minutes). `/forgot-password` and `/reset-password` are the only pages besides `/login` reachable without a session.

## Layout

```
app/
  login/            sign-in page
  (dashboard)/      every signed-in page, sharing the sidebar layout
  actions/          server actions: auth.ts (login/logout), admin.ts (all mutations)
components/         UI kit, charts, sidebar, dialogs, toasts
lib/api.ts          adminFetch(): authenticated calls to /api/admin
lib/types.ts        API response shapes
```
