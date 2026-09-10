# Product : SLTravelBuddy	
### **created by** : _Praveena Gunasekara (AMG)_

###### ER Diagram / Class Diagram / UseCase Diagram : https://www.figma.com/board/lqJHpKPdAfaj7JO0hIEtAw/SL-Travel-Buddy---Chen-ER-Diagram?node-id=8-578&t=p95Y9J2gn65iPhsZ-1

---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Backend | Java 21+, Spring Boot 4 (Web MVC, Data JPA, Security, Validation, Mail) |
| Database | MySQL (via Hibernate/JPA) |
| Auth | JWT (stateless, role-based: **Owner** / **Manager**) |
| Frontend | Vanilla HTML, CSS, and JavaScript — a hand-built single-page app (no framework), served as static resources by Spring Boot |
| AI Assistant | Hybrid: hardcoded business-data intents (instant, free, always-on) + Google Gemini API fallback for open-ended questions |
| Email | Spring Mail (SMTP) — login notifications & password-reset OTPs |
| Build | Maven |
 
---

#  Features 

## 1 - login
<img width="1920" height="1080" alt="1" src="https://github.com/user-attachments/assets/f1037e78-26af-4c90-a568-005cd0fa377a" />
Username/password sign-in, backed by BCrypt password hashing and JWT session tokens. The greeting on this page changes with the time of day (Good Morning / Good Afternoon / Good Evening / Good Night).
```
Owner: 
User Name :amg
Password :amg123
```
```
Manager:
User Name :sampath
Password :sampath123
```
---
```
mysql username: root
mysql password: mysql
```


## 2 - Forget password
<img width="1920" height="1080" alt="2" src="https://github.com/user-attachments/assets/e000ec44-00a2-44c3-a546-3f362043adf8" />
Users who forget their password can request a reset using their registered email — no need to contact an admin.

## 3 - Forget password using email OTP
<img width="1920" height="1080" alt="3" src="https://github.com/user-attachments/assets/3956ac00-6ee7-4e7c-bda7-dd93fd1280a8" />

## 4 - Forget password using email OTP
<img width="1920" height="1080" alt="4" src="https://github.com/user-attachments/assets/7470bd41-f371-48ee-b11b-fd02577e91f1" />

## 5 - after forget - reset password
<img width="1916" height="913" alt="5" src="https://github.com/user-attachments/assets/681bafe8-2b08-4f26-abf6-9f8450ff6537" />
After a valid OTP is verified, the user sets a new password. The OTP is marked used immediately afterward, so it can't be replayed.

## 6 - Dashboard
<img width="1920" height="1080" alt="6" src="https://github.com/user-attachments/assets/0036240b-a48b-43f8-956b-00078eb3c877" />
The single-page Dynamic app shell — every other screen below loads inside this same page via client-side routing, with no full page reloads. Shows at-a-glance income, expenses, profit, and active alerts.

## 7 - Calculator
<img width="1920" height="1080" alt="7 calculator" src="https://github.com/user-attachments/assets/8ff331cc-0ac1-4d5a-8dd0-8dd80781c232" />
A quick built-in calculator accessible from the top bar on any page, for on-the-spot arithmetic without leaving the app.

## 8 - Night mod / Light mod
<img width="1920" height="1096" alt="8 night mod" src="https://github.com/user-attachments/assets/ef4eee0b-31b2-48c5-8e69-447b9e6347f2" />
A complete, purpose-designed dark theme (not just an inverted light theme) — every surface, status color, and interactive state was individually tuned for readability and contrast, switchable per-user from Settings.

## 9 - search any component
<img width="1920" height="1080" alt="9 search any component" src="https://github.com/user-attachments/assets/2493dffa-9d00-424c-bac9-41ac3af1dbec" />
Search across the app's pages, records, and actions from one search box, and jump straight to what you need.

## 10 - Notify alert 
<img width="1920" height="1080" alt="10 notify alert " src="https://github.com/user-attachments/assets/2c2aa120-66e9-4d2e-a90a-9fcddb28ca03" />
Automatic alerts for things that need attention — licenses/insurance nearing expiry, overdue maintenance, and similar business-critical reminders.

## 11 - AI Chat Bot
<img width="1920" height="1080" alt="11 AI Chat Bot" src="https://github.com/user-attachments/assets/ea877d3c-f491-4a8d-8d2e-bba3885ccbbc" />
A floating "Business Assistant" widget with a two-layer brain:
- **Hardcoded intents** answer common questions (profit/income/expenses for any period, top routes, top drivers, fleet/staff counts, biggest expense category, month-over-month comparisons, maintenance alerts, and more) directly from live database queries — instant, and free.
- **Google Gemini API fallback** handles anything open-ended, using a live summary of the business data as context.

## 12 - print records
<img width="1920" height="1080" alt="12 print records" src="https://github.com/user-attachments/assets/3c97e2f6-64d4-4977-9a89-58b32d031385" />
Any data table can be printed directly to a clean, formatted printout.

## 13 - Manage Bus
<img width="1920" height="1080" alt="13 Manage Bus" src="https://github.com/user-attachments/assets/e59f495c-ef13-4b52-92d0-1c8416d33c6e" />
Full fleet registry — bus number, type, seating, route permit, license renewal date, insurance expiry, mileage, and status — the source of truth every trip, maintenance record, and part purchase links back to.

## 14 - Manage trip
<img width="1920" height="1080" alt="14 Manage trip" src="https://github.com/user-attachments/assets/944f3d52-547c-48e8-924d-046350c22f08" />
Create and manage trips with a full crew assignment panel — Driver 1, Driver 2 (optional), Conductor, Helper, and Cleaner — each filled via a name-search autocomplete restricted to employees of the matching role. A trip cannot be saved without at least one driver, enforced on both the UI and the backend.

## 15 - Event Booking
<img width="1920" height="1080" alt="15 Event Booking" src="https://github.com/user-attachments/assets/1fb8f92b-02d1-421a-b433-49d577c3d2fc" />
Manage charter/event bookings — start/end locations, dates, bus assignment, and customer details.

## 16 - Customer using events
<img width="1920" height="1080" alt="16 Customer using events" src="https://github.com/user-attachments/assets/a3a8095f-7ce4-4757-bc4b-d3f79838eb1d" />
Each booking still keeps its own snapshot of the customer's details as they were at the time of booking, so editing a customer's info later never silently rewrites history.

## 17 - Trip Expenses
<img width="1920" height="1080" alt="17 Trip Expenses" src="https://github.com/user-attachments/assets/a92c896c-de21-406f-a718-131e9ed8011b" />
Fuel, parking, and other trip costs, together with that trip's crew salary payments, recorded as one combined entry per trip.

## 18 - All Employees
<img width="1920" height="1080" alt="18 All Employees" src="https://github.com/user-attachments/assets/7a0bb003-eb4a-42ff-948b-a66059c15323" />
Employee directory with category (driver/conductor/helper/cleaner), contact info, NIC, driving license number, join date, and status.

## 19 - Manager Salary maintain
<img width="1920" height="1080" alt="19 Manager Salary maintain" src="https://github.com/user-attachments/assets/a63a3f6f-a92d-42f4-b5cc-9b59e10b000f" />
Record salary payments to employees, whether tied to a specific trip or paid independently.

## 20 - View all employe salary
<img width="1920" height="1080" alt="20 view all employe salary" src="https://github.com/user-attachments/assets/9a6cc343-151f-4c73-9f45-a7f568598bd8" />
A complete, filterable payment history across all employees.

## 21 - Maintenance (you can add maintanace receipt)
<img width="1920" height="1080" alt="21 Maintenance (you can add maintanace receipt)" src="https://github.com/user-attachments/assets/9f82e130-25e9-4e3f-9261-0c61a5ce0b71" />
Log service history per bus — technician, cost, mileage at service — with an attached receipt/damage photo stored on the server and served back on demand.

## 22 - Part Purchases
<img width="1920" height="1080" alt="22 Part Purchases" src="https://github.com/user-attachments/assets/03287ea6-d85e-4f94-b550-3fbdf375ef98" />
Track spare-part purchases per bus — part name, quantity, unit price, supplier — also with a bill/receipt photo attachment.

## 23 - Other service (you can any other service or cost add)
<img width="1920" height="1080" alt="23 other service (you can any other service or cost add)" src="https://github.com/user-attachments/assets/17080fee-0176-40ff-be55-233e1cb38dd4" />
A catch-all for any other business cost that doesn't fit the categories above.

## 24 - Fuel or tickets update prices
<img width="1920" height="1080" alt="24 fuel or tickets update prices" src="https://github.com/user-attachments/assets/2f667143-92ba-4a31-af04-5fc25f52d84f" />
A running history of fuel and ticket price changes over time, so historical reports stay accurate to the prices in effect at the time.

## 25 - Report
<img width="1920" height="1080" alt="25 Report" src="https://github.com/user-attachments/assets/98ebd40c-1a05-4e4a-9265-98d9fc7f3ea0" />
A financial command center — filter by date range (or use the Last 7/30/90 Days and This Year quick filters) and see income, expenses, salary, and net profit at a glance, with a daily profit trend chart and expense breakdown.

## 26 - income report
<img width="1920" height="1080" alt="26 income report" src="https://github.com/user-attachments/assets/ac5c378a-b26e-4dda-8806-387ba4e5ced3" />
Income broken down by trip and route for the selected period.

## 27 - All Expenses Report
<img width="1920" height="1080" alt="27 All Expenses Report" src="https://github.com/user-attachments/assets/5e5c0134-eb55-4f2e-b8a5-7764bc868609" />
Every expense category (fuel, maintenance, parts, salaries, other) in one consolidated view.

## 28 - Salary Report
<img width="1920" height="1080" alt="28 Salary Report" src="https://github.com/user-attachments/assets/d445ca07-bd2d-48a8-a4ea-4a2c2f15d81f" />
Total salary payouts across the selected period, by employee.

## 29 - All trip report
<img width="1920" height="1080" alt="29 All trip report" src="https://github.com/user-attachments/assets/e395d2ad-3bdc-48b9-8b4b-9e066c379a66" />
A complete trip log for the selected period, with route, distance, income, and crew.

## 30 - Daily Profit
<img width="1920" height="1080" alt="30 Daily Profit" src="https://github.com/user-attachments/assets/c7a6f028-8d13-4ae8-a7af-6c85ebce4ce2" />
Day-by-day profit trend for the selected period.

## 31 - Monthly Profit
<img width="1920" height="1080" alt="31 Monthly Profit" src="https://github.com/user-attachments/assets/e9e35b98-49d5-4717-ba98-ee707e8bed02" />
Profit aggregated by month, for spotting longer-term trends.

## 32 - Leader board (best driver / best Conductoor / Best Income Route)
<img width="1920" height="1080" alt="32 leader board (best driver , best Conductoor , Best Income Route)" src="https://github.com/user-attachments/assets/7016ca7d-e3c7-4d4f-989e-b2c48d8b8d30" />
Top performers for the selected period — best driver, best conductor, and highest-income route — a quick way to recognize good performance.

## 33 - Tools
<img width="1920" height="1080" alt="33 Tools" src="https://github.com/user-attachments/assets/f5687179-0376-400a-986a-74253f229ba2" />
A utility hub for day-to-day helper tools.

## 34 - Route Finder
<img width="1920" height="1080" alt="34 Route Finder" src="https://github.com/user-attachments/assets/8ecb5e61-a4d0-4b4b-a906-8250a7aef8aa" />
Look up route information quickly without digging through the Trips table.

## 35 - Manage User
<img width="1920" height="1080" alt="35 Manage User" src="https://github.com/user-attachments/assets/9a3c61c4-90ea-4932-a7f2-cc7825a73d43" />
Owner-only screen for creating and managing system login accounts and roles (Owner / Manager/ admin) — protected on the backend, not just hidden in the UI.

## 36 - Setting (change Current user Password)
<img width="1920" height="1080" alt="36" src="https://github.com/user-attachments/assets/d5db1211-3731-4f0c-a2f8-4d713f2f6918" />
Per-user preferences — switch between light/dark mode, and change your own account password (current password required to confirm it's you).

## 37 - Export CSV
<img width="1920" height="1080" alt="37 Export CSV" src="https://github.com/user-attachments/assets/fba643e1-b9b7-4ead-82e6-728c18151f67" />
Any data table can be exported to CSV for use in Excel or elsewhere.

## 38 - Ditect Manager Log for owner using email 
<img width="950" height="525" alt="38 ditect Manager Log for owner" src="https://github.com/user-attachments/assets/0e80f409-a34d-4f8c-9a0f-5f8db9791151" />
Every time anyone signs in, every active Owner account gets an email notification (name, role, and sign-in time) — a lightweight security/visibility measure so the Owner always knows who's accessing the system, sent asynchronously so it never slows down the person logging in.
##

# ER Diagram 
<img width="6026" height="11184" alt="ER Digram" src="https://github.com/user-attachments/assets/46d36002-b49c-48cb-9358-be3981d19a9b" />

# Use Case Diagram 
<img width="1192" height="1600" alt="compress use case" src="https://github.com/user-attachments/assets/76d2ba0a-998f-4384-910d-27e7072bc379" />

# Class Diagram
<img width="7936" height="9664" alt="Class Digram" src="https://github.com/user-attachments/assets/8ce338b9-6933-42a0-8be5-45f62482137e" />















