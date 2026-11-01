# Asset Management System (AMS) — Web Edition Guide

## 🌐 Overview
The Asset Management System has been converted into a standalone **Web-Based Application**. It runs directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari) and can be accessed locally or shared across an entire institutional local area network (LAN/Wi-Fi).

---

## 🚀 Quick Start (Running the Web System)

### Option 1: Standard Start
```bash
npm start
```
*(or `npm run web` or `node server.js`)*

When started:
1. The backend Express API boots up on port `5002` (or custom `AMS_PORT`).
2. The SQLite database is automatically loaded from `./data/asset-management.db`.
3. Your default web browser will automatically open to `http://localhost:5002`.
4. The console displays your institutional network IP address (e.g. `http://10.93.78.234:5002`) so colleagues can connect from their computers or mobile devices without installing any software!

---

## 🛠️ Development & Building

### Run Development Mode (Live Reloading)
```bash
npm run web:dev
```
- Starts Vite client with Hot Module Replacement (HMR) on port `5173`.
- Automatically proxies API requests to the backend server on port `5001`.

### Build for Production
```bash
npm run web:build
```
- Builds both the optimized React client into `dist/` and the server into `dist-server/server.js`.

---

## 📡 Institutional Network (LAN) Access

Because the web server listens on all network interfaces (`0.0.0.0`), any staff member on the organization's network can access the system simply by typing the host machine's IP address:

```text
http://<HOST-IP-ADDRESS>:5001
```

*Example:* `http://10.93.78.234:5001` or `http://192.168.1.100:5001`

---

## 💾 Database & Storage
- **Location:** `./data/asset-management.db`
- **Engine:** SQLite with Write-Ahead Logging (WAL) for maximum reliability and concurrency.
- **Portability:** The database is self-contained within the project folder. Backups can be made simply by copying the `data/` directory.

---

## 🔑 Default User Accounts

| Full Name | Role | Email | Password |
|---|---|---|---|
| **System Admin** | Admin | `admin@ams.local` | `12345@Aams` |
| **ተመስገን መርሻ** | Admin | `temesgen@ams.local` | `12345@Aams` |
| **አንተነህ መኮንን** | Auditor | `anteneh@ams.local` | `12345@Aams` |
| **ዮሐንስ ጌታቸው** | Guest | `yohannes@ams.local` | `12345@Aams` |
| **አለሙ በቀለ** | Guest | `alemu@ams.local` | `12345@Aams` |
