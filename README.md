# Asset Management System v2.0.0 Enterprise Edition

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)

**Professional, Enterprise-Grade Asset & Inventory Management System**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Support](#-support)

</div>

---

## 📋 Overview

A comprehensive, offline-first asset and inventory management system built for healthcare facilities, offices, warehouses, and organizations that need professional tracking of assets, equipment, and supplies.

### Built With
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Prisma ORM** - Type-safe database access
- **NextAuth.js** - Authentication & authorization
- **Tailwind CSS** - Modern UI styling
- **Electron** - Cross-platform desktop application
- **SQLite/PostgreSQL** - Flexible database options

---

## ✨ Key Features

### 🔐 Security & Access Control
- **Role-Based Access Control** - 4 user roles (ADMIN, MANAGER, STAFF, VIEWER)
- **Secure Authentication** - BCrypt password hashing, account lockout protection
- **Session Management** - Secure session tracking with JWT
- **Audit Logging** - Complete audit trail of all actions
- **Permission System** - Granular permission control per action

### 📦 Inventory Management
- **Comprehensive Asset Tracking** - Serial numbers, barcodes, warranty, purchase info
- **Multi-Category Organization** - Medical, Electronics, Furniture, Stationery, etc.
- **Condition Tracking** - FUNCTIONAL, MAINTENANCE, DAMAGED, DISPOSED
- **Location Management** - Track asset locations across facilities
- **Low Stock Alerts** - Automatic notifications when items reach reorder level
- **Bulk Import** - Import multiple items at once

### 💼 Transaction Management
- **Stock-In (Model 19)** - Purchase orders, supplier tracking, invoice management
- **Stock-Out (Model 20)** - Requisitions, department allocation, recipient tracking
- **Auto Voucher Generation** - M19-XXXX and M20-XXXX automatic numbering
- **Financial Tracking** - Unit prices, total costs, multi-currency support
- **Approval Workflows** - Transaction approval system
- **Transaction History** - Complete audit trail per item

### 🔧 Maintenance Management
- **Preventive Maintenance** - Schedule and track routine maintenance
- **Corrective Maintenance** - Log repairs and fixes
- **Cost Tracking** - Labor and parts cost breakdown
- **Technician Management** - Track who performed maintenance
- **Next Due Dates** - Maintenance scheduling

### 📊 Reporting & Analytics
- **Dashboard Statistics** - Real-time inventory and transaction metrics
- **Low Stock Reports** - Items needing reorder
- **Transaction Reports** - Stock-in/stock-out analysis
- **Category Analytics** - Assets by category breakdown
- **Export Capabilities** - JSON, CSV, PDF, Excel formats

### 👥 User Management
- **Multi-User Support** - Unlimited users with role assignment
- **Profile Management** - Employee ID, department, position tracking
- **Account Control** - Activation, deactivation, password reset
- **Activity Tracking** - Last login, IP address, session management

### 🔔 Notifications
- **Low Stock Alerts** - Automatic notifications to managers
- **System Notifications** - Important system events
- **User Notifications** - Personal notifications per user

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Windows 10/11 (for Electron build)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/asset-management.git
cd asset-management

# Install root dependencies
npm install

# Navigate to default-app
cd default-app

# Install application dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### Development Mode

```bash
# Quick start (Next.js dev server)
cd default-app
npm run dev

# Or use the quick-start script
# Double-click: quick-start.bat
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| ADMIN | AbeTech | TechAbe@123 |
| MANAGER | manager | Manager@123 |
| STAFF | staff | Staff@123 |
| VIEWER | viewer | Viewer@123 |

⚠️ **Change these passwords in production!**

---

## 📦 Building for Production

### Desktop Application (Electron)

```bash
# Run the automated build script
build-installer.bat

# Or manual build
npm run build:electron
npx electron-builder --win
```

**Output:** `dist/Asset Management System-2.0.0-Setup.exe`

### Web Application Deployment

See [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md) for complete deployment guide.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ENTERPRISE-ARCHITECTURE.md](ENTERPRISE-ARCHITECTURE.md) | Complete system architecture, design patterns, security |
| [API-DOCUMENTATION.md](API-DOCUMENTATION.md) | Complete API reference with examples |
| [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md) | Server setup, security hardening, monitoring |
| [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md) | Building desktop and web versions |
| [ENTERPRISE-UPGRADE-SUMMARY.md](ENTERPRISE-UPGRADE-SUMMARY.md) | Features and improvements overview |

---

## 🏗️ Architecture

### Layered Architecture

```
┌─────────────────────────────────┐
│    Presentation Layer           │  React Components, Pages
├─────────────────────────────────┤
│    API Layer                    │  Next.js API Routes
├─────────────────────────────────┤
│    Service Layer                │  Business Logic
├─────────────────────────────────┤
│    Data Access Layer            │  Prisma ORM
├─────────────────────────────────┤
│    Database                     │  SQLite / PostgreSQL
└─────────────────────────────────┘
```

### Project Structure

```
asset-management-system/
├── default-app/               # Next.js Application
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API Routes
│   │   ├── inventory/        # Inventory page
│   │   ├── stock-in/         # Stock-in page
│   │   ├── stock-out/        # Stock-out page
│   │   └── reports/          # Reports page
│   ├── components/           # React Components
│   ├── lib/                  # Core Libraries
│   │   ├── services/         # Business Logic Services
│   │   ├── middleware/       # API Middleware
│   │   ├── errors.ts         # Custom Error Classes
│   │   ├── logger.ts         # Logging Service
│   │   └── validation.ts     # Input Validation
│   └── prisma/               # Database
│       ├── schema.prisma     # Database Schema
│       └── seed.js           # Seed Data
├── src/                      # Electron Source
├── build/                    # Build Resources
└── docs/                     # Documentation
```

---

## 🔒 Security Features

### Authentication & Authorization
✅ BCrypt password hashing (12 rounds)  
✅ Failed login tracking and account lockout  
✅ Session management with JWT  
✅ Role-based access control (RBAC)  
✅ Permission-based authorization  

### Data Protection
✅ Input validation and sanitization  
✅ XSS protection  
✅ SQL injection prevention  
✅ CSRF protection  
✅ Rate limiting (100 req/min)  

### Audit & Compliance
✅ Complete audit trail  
✅ User activity tracking  
✅ IP address logging  
✅ Change history tracking  

---

## 🎯 Use Cases

### Healthcare Facilities
- Medical equipment tracking
- Maintenance scheduling
- Consumable inventory
- Department allocations
- Compliance reporting

### Offices & Businesses
- IT asset management
- Furniture tracking
- Stationery inventory
- Equipment maintenance
- Purchase tracking

### Warehouses
- Stock management
- Supplier tracking
- Multi-location inventory
- Transaction logging
- Reorder management

---

## 🛠️ Development

### Code Standards
- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Service layer pattern
- Error handling throughout

### Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Format code
npm run format
```

---

## 📊 Database Schema

### Core Tables
- **User** - User accounts and authentication
- **Item** - Assets and inventory items
- **Transaction** - Stock-in and stock-out records
- **MaintenanceLog** - Equipment maintenance history
- **AuditLog** - System audit trail
- **Category** - Asset categories
- **Department** - Organizational units
- **Supplier** - Vendor management
- **Notification** - User notifications
- **SystemConfig** - Application configuration

**Total:** 13 tables with 150+ fields and 25+ indexes

---

## 🚀 Performance

- **Pagination** - All list APIs support pagination (max 100 items)
- **Indexes** - Strategic database indexing for fast queries
- **Connection Pooling** - Efficient database connections
- **Rate Limiting** - Prevents API abuse
- **Caching** - Redis-ready architecture

---

## 📈 Scalability

### Deployment Options

**Option 1: Desktop (Electron)**
- Single-user or small team
- Embedded SQLite database
- No server required
- Portable installation

**Option 2: Web Application**
- Multi-user enterprise deployment
- PostgreSQL database
- Load balancing support
- Cloud or on-premises

---

## 🔄 Updates & Maintenance

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Backup & Restore

```bash
# Backup SQLite
cp default-app/prisma/dev.db backup/dev_backup_$(date +%Y%m%d).db

# Backup PostgreSQL
pg_dump -U username dbname > backup.sql

# Restore PostgreSQL
psql -U username dbname < backup.sql
```

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
npx prisma generate
npx prisma migrate deploy
```

**Build Fails:**
```bash
# Clear cache
rm -rf node_modules
rm -rf default-app/node_modules
npm install
cd default-app && npm install
```

**Authentication Issues:**
```bash
# Reset database
cd default-app
npx prisma migrate reset --force
```

---

## 🤝 Contributing

This is a proprietary enterprise system. For feature requests or bug reports, contact the development team.

---

## 📄 License

Proprietary - All Rights Reserved  
© 2026 AbeTech

---

## 📞 Support

### Technical Support
- **Email:** admin@abetech.com
- **Documentation:** See `/docs` directory
- **Issues:** Contact system administrator

### Resources
- [Architecture Documentation](ENTERPRISE-ARCHITECTURE.md)
- [API Reference](API-DOCUMENTATION.md)
- [Deployment Guide](PRODUCTION-DEPLOYMENT.md)
- [Build Instructions](BUILD-INSTRUCTIONS.md)

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Electron](https://www.electronjs.org/)

---

## 📜 Changelog

### Version 2.0.0 (October 11, 2026)
- ✨ Complete enterprise architecture redesign
- 🔐 Advanced security features
- 📊 Enhanced database schema (13 tables)
- 🎯 Service layer implementation
- 📝 Comprehensive logging and audit system
- 👥 Multi-role user management
- 📚 Complete documentation suite
- 🚀 Production-ready deployment guides

### Version 1.0.0
- Initial release
- Basic inventory tracking
- Simple transaction management

---

<div align="center">

**Built with ❤️ by AbeTech**

*Professional Asset Management for Modern Organizations*

[⬆ Back to Top](#asset-management-system-v200-enterprise-edition)

</div>
