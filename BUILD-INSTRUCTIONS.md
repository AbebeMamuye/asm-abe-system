# Asset Management System - Build Instructions

**Version:** 2.0.0  
**Author:** AbeTech  
**Updated:** October 11, 2026

## ✅ Changes Applied

### 1. Admin Credentials Updated
- **Username:** `AbeTech`
- **Password:** `TechAbe@123`
- Database has been reset and seeded with new credentials

### 2. Version Updated
- Application version bumped to **2.0.0**
- Author changed to **AbeTech**

---

## 🚀 Quick Start (Testing Only)

To test the system without building an installer:

```bash
# Run the quick-start script
quick-start.bat
```

This will:
- Set up the database
- Start the Next.js server on http://localhost:3000
- Allow you to test the system immediately

**Login with:**
- Username: `AbeTech`
- Password: `TechAbe@123`

---

## 📦 Building the Installer

### Prerequisites

1. **Node.js** (v18 or higher)
2. **NPM** (comes with Node.js)
3. **Stable Internet Connection** (~137 MB download for Electron)
4. **Disk Space** (~2 GB free space recommended)

### Build Steps

#### Option 1: Automated Build (Recommended)

Simply run:

```bash
build-installer.bat
```

This script will:
1. Clean old builds
2. Install dependencies
3. Build the Next.js app
4. Build the Electron app
5. Create the Windows installer (NSIS)

**Expected Build Time:** 15-30 minutes (depending on internet speed)

#### Option 2: Manual Build

If the automated script fails, run these commands:

```bash
# 1. Install root dependencies
npm install

# 2. Build default-app
cd default-app
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
cd ..

# 3. Build Electron
npm run build:electron

# 4. Create installer
npx electron-builder --win --config electron-builder.yml
```

---

## 📂 Output Files

After successful build:

### Installer
```
dist/Asset Management System-2.0.0-Setup.exe
```
- Full Windows installer (NSIS)
- Includes installation wizard
- Creates desktop shortcut
- Adds to Start Menu
- ~150-200 MB

### Portable Version
```
dist/win-unpacked/asset-management-system.exe
```
- Unpacked Electron app
- No installation required
- Can be copied to any Windows PC
- ~300-400 MB folder

---

## 🛠️ Troubleshooting

### Issue 1: Electron Download Fails

**Symptoms:**
- Build hangs at "downloading Electron"
- "retrying attempt=1" messages
- Timeout errors

**Solutions:**
1. Check internet connection
2. Clear electron cache:
   ```bash
   rmdir /s /q "%LOCALAPPDATA%\electron"
   rmdir /s /q "%LOCALAPPDATA%\electron-builder"
   ```
3. Try again with better internet connection
4. Or manually download: https://github.com/electron/electron/releases/tag/v39.8.10

### Issue 2: "zip: not a valid zip file"

**Solution:**
Clear corrupted cache:
```bash
rmdir /s /q "%LOCALAPPDATA%\electron"
rmdir /s /q "%LOCALAPPDATA%\electron-builder"
```

### Issue 3: Prisma/Database Errors

**Solution:**
Reset the database:
```bash
cd default-app
npx prisma migrate reset --force
npx prisma db seed
cd ..
```

### Issue 4: Build Space Issues

**Solution:**
Clean old builds:
```bash
rmdir /s /q dist
rmdir /s /q out
rmdir /s /q default-app\.next
rmdir /s /q default-app\node_modules
rmdir /s /q node_modules
```

Then run `npm install` and try again.

---

## 📋 System Requirements

### Development Machine
- Windows 10/11
- 8 GB RAM minimum
- 5 GB free disk space
- Node.js v18+

### Target Deployment
- Windows 10/11
- 4 GB RAM minimum
- 500 MB free disk space
- No internet required (offline-first)

---

## 🔐 Default Credentials

**Admin Login:**
- Username: `AbeTech`
- Password: `TechAbe@123`

⚠️ **Important:** Change this password in production!

To change admin password:
1. Edit `default-app/prisma/seed.js`
2. Change the password in `bcrypt.hash('YOUR_NEW_PASSWORD', 10)`
3. Run: `npx prisma migrate reset --force`

---

## 📝 Build Configuration

### Electron Builder Config
- File: `electron-builder.yml`
- Installer type: NSIS (Windows Setup)
- Target: Windows x64
- One-click: Disabled (full wizard)
- Desktop shortcut: Always created
- Start menu: Enabled

### Application Structure
```
dist/
├── Asset Management System-2.0.0-Setup.exe  (Installer)
├── win-unpacked/                            (Portable)
│   ├── asset-management-system.exe
│   ├── resources/
│   └── ...
└── builder-effective-config.yaml            (Build log)
```

---

## 🎯 Distribution

### Option 1: Installer Distribution
1. Share `Asset Management System-2.0.0-Setup.exe`
2. Users run the installer
3. Application is installed to their system
4. Desktop shortcut created automatically

### Option 2: Portable Distribution
1. Zip the `dist/win-unpacked` folder
2. Share the ZIP file
3. Users extract and run `asset-management-system.exe`
4. No installation required

---

## ✨ Features

- **Offline-First:** Works without internet
- **Asset Management:** Track all types of assets
- **Stock Control:** Model 19 (Stock-In) & Model 20 (Stock-Out)
- **Reporting:** Excel and PDF exports
- **Authentication:** Secure login system
- **Multi-Category:** Medical, Electronics, Stationery, Cleaning, etc.
- **Maintenance Tracking:** Record equipment servicing
- **Transaction History:** Full audit trail

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in `err.log` or `err2.log`
3. Check Prisma logs in console
4. Verify all dependencies are installed

---

## 🔄 Version History

### v2.0.0 (October 11, 2026)
- Updated admin credentials to AbeTech/TechAbe@123
- Version bump for new deployment
- Enhanced build scripts
- Improved documentation

### v1.0.0 (Previous)
- Initial release
- Default admin/admin123 credentials

---

**Built with:** Electron + Next.js + Prisma + SQLite + Tailwind CSS
