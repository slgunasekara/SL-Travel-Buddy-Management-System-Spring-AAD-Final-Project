# SL Travel Buddy — Bus Management System (Web Edition)

A full front-end replica of the original JavaFX + MySQL desktop application,
built with **plain HTML, CSS and JavaScript**. All data is stored locally in
your browser using `localStorage` — no backend server or database required.

## How to run

**Option 1 — Just open it**
Double-click `index.html` (or `dashboard.html`) and it will open in your
default browser. Everything works offline except the Google Fonts (Sora /
Inter) and the "Route Finder" tool, which need an internet connection.

**Option 2 — Local server (recommended for the smoothest experience)**
```bash
cd bus-management-web
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```

## Demo accounts
| Username | Password  | Role    |
|----------|-----------|---------|
| amg      | amg123    | Owner   |
| sampath  | sampath123| Manager |

Only the **Owner** role can access "Manage Users".

## Where your data lives
Everything is saved in your browser's `localStorage` under keys prefixed
`bms_`. Data persists across page reloads and browser restarts, but is
specific to the browser/profile you're using (clearing browser data will
reset the app). To start completely fresh, open the browser console and run:
```js
localStorage.clear(); location.reload();
```

## Features (matches the desktop application 1:1)
- Login with role-based access + Forgot Password / OTP reset flow
  (OTP is shown on-screen since there's no mail server in a static app)
- Dashboard — fleet KPIs, 30-day income/expense/profit chart, document
  expiry alerts, recent trips
- Manage Bus — fleet CRUD, insurance/license tracking, mileage
- Manage Trip — trip CRUD + crew assignment (driver/conductor/helper/assistant)
- Event Bookings — private hire / charter management
- Trip Expenses — fuel, parking, other on-trip costs
- Manage Employee — driver/staff records with NIC & contact validation
- Employee Salary — payments, optionally linked to a trip
- Maintenance — service history & cost per bus
- Part Purchases — spare parts, optionally linked to a maintenance job
  (auto-calculated total cost)
- Other Services — miscellaneous costs (cleaning, permits, etc.)
- Update Prices — fuel & ticket price history with auto change amount / %
- Reports — Overview, Income, Expense, Salary, Trip, Daily Profit and
  Monthly Profit, all with date-range filters and CSV export
- Bus Management Tools — quick calculator, fuel cost calculator, profit
  calculator, time duration calculator, and a route finder that opens
  Google Maps directions
- Manage Users — Owner-only system user administration

## New since the original build
- **Customers** — a dedicated customer database (separate from Event
  Bookings), showing how many bookings each customer has made
- **Settings** — appearance (dark mode), full data backup/restore, and a
  "reset to demo data" option
- **Dark Mode** — toggle in the top bar (🌙/☀️), persisted per device
- **Global Search (Ctrl/Cmd+K)** — jump straight to any bus, trip,
  employee, or customer, or to any page, from anywhere in the app
- **Sidebar collapse** — a chevron button collapses the sidebar to
  icon-only on desktop, for more screen space
- **Sortable table columns** — click any column header to sort ascending/
  descending
- **Data Backup & Restore (JSON)** — since everything is stored in the
  browser, Settings → "Export All Data" downloads a full JSON backup, and
  "Import Backup" restores it (useful before clearing browser data or
  switching devices)
- **Notification Bell** — the same fleet/document alerts from the
  dashboard are now reachable from a bell icon on every page
- **Bus Service Reminders** — in addition to insurance/license expiry,
  the app now flags buses that are overdue (or due soon) for maintenance,
  based on the last service's date and mileage
- **Print / Receipt Generator** — a 🖨 icon on Event Bookings and Trips
  opens a clean, print-ready receipt in a new tab (use the browser's
  "Save as PDF" if you want a file — no backend needed)
- **Trip Calendar View** — a Table/Calendar toggle on the Trips page
  shows a month calendar with a trip-count badge per day; click a day to
  filter the table to just that date
- **CSV Import** — Bus and Employee pages have an "Import CSV" button
  (next to Export CSV) for bulk-adding records from a spreadsheet
- **Expense Breakdown Pie Chart** — Reports → Overview now shows a donut
  chart of trip expenses / salaries / maintenance / parts / other
  services for the selected date range
- **Top Routes / Top Drivers Leaderboard** — Reports → Leaderboard ranks
  routes by income and drivers by trip count
- **Month-over-Month Comparison** — the dashboard shows this month vs
  last month for income, expenses, profit, and trip count, with %
  change indicators
- **Better empty states** — list pages show a simple icon instead of
  plain text when there's no data yet
- **Real logo** — the SL Travel Buddy logo now appears on the login
  screen, the sidebar, and the browser tab favicon

## Sending real OTP emails (optional but recommended)
By default, "Forgot password" generates and validates a real OTP exactly
like the desktop app did, but shows it on-screen instead of emailing it —
because a static HTML/JS site has no safe place to store real mailbox
credentials (see the security note below).

To make the OTP actually arrive in the user's inbox:
1. Create a free account at **https://www.emailjs.com** (200 emails/month
   free).
2. Add an Email Service → connect your Gmail via OAuth (no password
   needed) → copy the **Service ID**.
3. Create an Email Template using these variable names: `{{to_email}}`,
   `{{to_name}}`, `{{otp_code}}`, `{{app_name}}` → copy the **Template ID**.
4. Copy your **Public Key** from Account → General.
5. Open `js/emailConfig.js` and paste the three values into `EmailConfig`.

That's it — no other code changes needed. If these values are left as
placeholders, or the send fails for any reason (offline, misconfigured),
the app automatically falls back to showing the OTP on-screen with a
clear "demo mode" label, so the flow never breaks.

**⚠️ Security note:** the original desktop app's `EmailService.java` had a
real Gmail app password hardcoded in plain text. That is *never* copied
into this web app — a browser-side app is fully viewable via "view
source", so any embedded secret is effectively public. If that app
password is still active, revoke/regenerate it from your Google Account →
Security → App Passwords.

## Notes on the web adaptation
- The desktop app used JasperReports to print PDF reports; this web
  version exports the same data as **CSV** instead, since PDF report
  generation isn't part of a plain HTML/CSS/JS stack.
- All validation rules (NIC format, 10-digit contact numbers, unique bus
  numbers/usernames, date logic, etc.) match the original Java validation.

## Design system (premium 3D / soft-UI theme)
- Theme colors live as CSS variables at the top of `css/style.css`
  (`--primary: #095dbd`, `--bg: #ffffff`, plus generated tints/shades
  `--primary-50` … `--primary-950`). Change `--primary` there to re-theme
  the whole app.
- **Logo:** the real SL Travel Buddy logo (`assets/SLTravelBuddy.png`) is
  wired into the login hero and the sidebar brand mark. If you ever swap
  the file, just replace `assets/SLTravelBuddy.png` (same filename) or
  update the `src=` in `index.html` and `js/router.js`. A bus-icon
  fallback shows automatically if the image ever fails to load.
- Cards, buttons, inputs, modals, the sidebar and the login hero all use
  layered gradients (not flat colors) plus soft shadows for a 3D soft-UI
  look. Buttons lift on hover and press inward on click; the topbar,
  modals and toasts use a frosted-glass (glassmorphism) blur.
- Login page has an animated drifting gradient background, floating glow
  blobs, a subtle shine sweep across the "SL Travel Buddy" heading, and a
  gently floating logo — all pure CSS, no extra libraries.
- Page content fades/slides in on load, and cards animate in as they
  scroll into view (`js/reveal.js`, a small dependency-free
  IntersectionObserver utility).
- **Quick Calculator:** a small calculator icon sits in the top bar, just
  to the left of the clock, on every page. Clicking it drops down a
  compact, glossy blue/white 3D calculator you can use from anywhere in
  the app without leaving the page (`js/quickCalc.js`). This is separate
  from — and doesn't change — the full calculator suite already on the
  **Tools** page.
- Motion respects `prefers-reduced-motion` for accessibility.
- This was a pure visual/styling pass — no HTML structure, JavaScript
  logic, routes, or features were changed.
