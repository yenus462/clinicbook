# ClinicBook testing guide

## Automatic checks (backend)

Start the backend (`npm run dev` in `backend`), then in another terminal:

    npm run check:all

| Script | What it proves |
|---|---|
| `check:auth` | Register, login, JWT, `/me`, role protection, no password data in responses |
| `check:admin` | Admin-only doctor, specialty and working-hours management, rules 15 and 16 |
| `check:booking` | Free slots, booking rules 1 to 9, no double booking, released slots |
| `check:appointments` | Patient cancel and reschedule, 2-hour rule, admin list, filters, pagination, status rules, statistics |
| `check:security` | Security headers, CORS, forged and expired tokens, oversized and malformed input, rate limiting |

Tip: for local testing set `AUTH_RATE_LIMIT="100"` in `backend/.env`. The security check
uses up the login limit on purpose, so restart the backend afterwards.

## Manual test: patient

1. Register a new account, then log out and log in again.
2. Open Doctors, search by name, filter by specialty.
3. Open a doctor, pick a date and a free time, add a reason, and book.
4. Check My Appointments, reschedule the booking, then cancel it.
5. Try to open `/admin` (you must be sent home).

## Manual test: admin

1. Log in as admin and open the dashboard.
2. Add a specialty, add a doctor with working hours, deactivate and reactivate it.
3. Try to change hours so they exclude an existing booking (must be refused).
4. In All Appointments, use each filter and the search, then complete or cancel a booking.

## Known limits

- A patient who sends two bookings for different doctors at the exact same instant could
  bypass the same-time rule (rule 3 is checked in code, not by the database).
- The login token is stored in `localStorage`, which scripts injected into the page could read.
  An httpOnly cookie would be safer but needs extra backend work.
- `npm audit` findings in development tools (eslint, vite, prisma CLI) do not ship to users.