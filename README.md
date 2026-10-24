# STI ParkTags (React)

```
npm install
npm run dev      # local dev server
npm run build    # static site in dist/ (hash routing, works on GitHub Pages)
```

## First-time setup (Firebase console)
1. Authentication → Sign-in method → enable **Email/Password**.
2. Authentication → Users → **Add user** (your admin). Copy its UID.
3. Realtime Database → add `roles/<UID>` = `{ "role": "admin", "email": "you@example.com" }`.
4. Sign in, then use **Accounts** to create guard/admin accounts.
5. **Gate controller (ESP32)**: add `roles/<its UID>` = `{ "role": "device", "email": "<its login email>" }` (UID from Authentication → Users). The controller keeps signing in as it does now.
6. **Publish `database.rules.json`** — without it, roles are only enforced in the UI. These rules also block
   unauthenticated writes, so the gate controller must sign in (give it its own account/role) before you publish.

## Roles
- **Admin**: Dashboard, Activity, Users + profiles (register/edit/delete), Gate cards, Accounts.
- **Guard**: Gate and Activity only — manual entries and adding details. No access to user records or registration.

## Manual gate card (reader/firmware side)
Register the card's UID under **Gate cards** (stored at `settings/manual_cards/<UID>`, uppercase).
When a tapped UID is in that list, the controller should open the gate immediately — skipping student lookup,
expiry and parked-status checks — and push this to `access_logs`:

```json
{ "card_uid": "<UID>", "access_type": "ENTRANCE" | "EXIT", "granted": true, "reader": "GATE1",
  "timestamp": {".sv": "timestamp"}, "manual_card": true, "needs_details": true }
```
The web app lists these as **Needs details**; the guard fills in the manual-entry form (remarks optional) and the log is updated in place.

### Admin override card (current firmware)
Logs with `user_type: "admin"` (written by the sketch's `logManualEntry`) are treated as **Needs details** automatically,
so `needs_details: true` is optional. Saving details replaces `user_type` with `student` or `visitor`, which clears the flag.

### Manual entries
Activity has a **Source** filter (all / manual entries / gate scans). In the manual-entry form the ID doesn’t have to be registered:
name, vehicle type and plate are typed in and stored on the log only (nothing is written to `students`). Once that ID is registered,
the log shows the registered name automatically. A registered user can also be logged with a vehicle that isn’t registered yet.
