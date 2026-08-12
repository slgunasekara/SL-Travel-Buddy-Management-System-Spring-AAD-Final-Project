# Gunasekara Bus Management System — Web Edition

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

## Notes on the web adaptation
- The desktop app used JasperReports to print PDF reports; this web
  version exports the same data as **CSV** instead, since PDF report
  generation isn't part of a plain HTML/CSS/JS stack.
- The desktop app emailed OTP codes via SMTP; this static version displays
  the OTP directly in the dialog with a clear "demo mode" label, since a
  front-end-only app cannot send real email.
- All validation rules (NIC format, 10-digit contact numbers, unique bus
  numbers/usernames, date logic, etc.) match the original Java validation.

## Design system (premium 3D / soft-UI theme)
- Theme colors live as CSS variables at the top of `css/style.css`
  (`--primary: #095dbd`, `--bg: #ffffff`, plus generated tints/shades
  `--primary-50` … `--primary-950`). Change `--primary` there to re-theme
  the whole app.
- **Logo:** search `css/style.css`'s companion files `index.html` and
  `js/router.js` for `PASTE_LOGO_IMAGE_URL_HERE` (2 occurrences) and
  replace with your real logo image URL. Until you do, a bus-icon
  fallback is shown automatically so nothing looks broken.
- Cards, buttons, inputs and modals use soft layered shadows, gradients
  and rounded corners (neumorphism/soft-UI). Buttons lift on hover and
  press inward on click; the navbar/topbar, modals and toasts use a
  frosted-glass (glassmorphism) blur effect.
- Page content fades/slides in on load, and cards animate in as they
  scroll into view (`js/reveal.js`, a small dependency-free
  IntersectionObserver utility — no external animation library needed).
- Motion respects `prefers-reduced-motion` for accessibility.
- This was a pure visual/styling pass — no HTML structure, JavaScript
  logic, routes, or features were changed.
