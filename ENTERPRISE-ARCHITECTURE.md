# Asset Management System - Enterprise Architecture Documentation

**Version:** 2.0.0 Enterprise Edition  
**Developer:** AbeTech  
**Last Updated:** October 11, 2026

---

## 🏗️ System Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 14.2.15 (React 18)
- TypeScript 5.4.5
- Tailwind CSS 4.2
- Lucide React (Icons)
- NextAuth.js (Authentication)

**Backend:**
- Next.js API Routes
- Prisma ORM 5.14.0
- SQLite (Development) / PostgreSQL (Production Ready)
- Node.js 18+

**Desktop:**
- Electron 39.8.10
- Electron Vite

---

## 📐 Architecture Patterns

### 1. **Layered Architecture**

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│  (React Components, Pages, UI)             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           API Layer                         │
│  (Next.js API Routes, REST Endpoints)      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Service Layer                     │
│  (Business Logic, Validation, Rules)       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Data Access Layer                 │
│  (Prisma ORM, Database Operations)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Database                          │
│  (SQLite/PostgreSQL)                       │
└─────────────────────────────────────────────┘
```

### 2. **Service-Oriented Design**

Each major domain has its own service module:

- **UserService** - User management, authentication, authorization
- **ItemService** - Asset/inventory management
- **TransactionService** - Stock-in/Stock-out operations
- **MaintenanceService** - Equipment maintenance tracking

### 3. **Repository Pattern**

Prisma ORM acts as the repository layer, providing:
- Type-safe database access
- Transaction management
- Query optimization
- Migration management

---

## 🔐 Security Architecture

### Authentication & Authorization

**Multi-Level Access Control:**

| Role    | Permissions |
|---------|-------------|
| ADMIN   | Full system access, user management, system configuration |
| MANAGER | Create/update assets, approve transactions, view reports |
| STAFF   | Create/update assets, create transactions, view reports |
| VIEWER  | Read-only access to assets and reports |

**Security Features:**

1. **Password Security**
   - BCrypt hashing (12 rounds)
   - Minimum 8 characters
   - Password change tracking
   - Force password change capability

2. **Account Protection**
   - Failed login attempt tracking
   - Automatic account locking (5 attempts)
   - Time-based lock expiration (30 minutes)
   - Account activation/deactivation

3. **Session Management**
   - JWT-based sessions
   - Secure HTTP-only cookies
   - Session expiration
   - Activity tracking

4. **Audit Logging**
   - All user actions logged
   - IP address tracking
   - User agent tracking
   - Change history preservation

### Input Validation & Sanitization

- Centralized validation using Validation Schemas
- XSS protection through input sanitization
- SQL injection prevention (Prisma parameterized queries)
- CSRF protection (Next.js built-in)

---

## 📊 Database Schema Design

### Core Entities

#### 1. **Item (Asset)**
```typescript
- Comprehensive asset information
- Serial number uniqueness
- Barcode/QR code support
- Multi-condition tracking (FUNCTIONAL, MAINTENANCE, DAMAGED, DISPOSED)
- Status management (ACTIVE, ARCHIVED)
- Purchase and warranty tracking
- Location management
- Tag-based organization
```

#### 2. **Transaction**
```typescript
- Stock-In (Model 19) and Stock-Out (Model 20)
- Auto-generated voucher numbers
- Financial tracking (unit price, total price, currency)
- Supplier and department tracking
- Approval workflow
- Status management (PENDING, APPROVED, COMPLETED, CANCELLED)
- Audit trail
```

#### 3. **User**
```typescript
- Role-based access control
- Extended profile information
- Security features (2FA ready, account locking)
- Login tracking
- Employee ID support
```

#### 4. **MaintenanceLog**
```typescript
- Preventive and corrective maintenance
- Technician tracking
- Cost breakdown (labor + parts)
- Schedule management
- Priority levels
- Parts replacement tracking
```

#### 5. **AuditLog**
```typescript
- Complete action history
- Before/after change tracking
- User attribution
- IP and user agent logging
- Success/failure tracking
```

### Supporting Entities

- **Category** - Asset categorization
- **Department** - Organizational units
- **Supplier** - Vendor management
- **SystemConfig** - Application settings
- **Notification** - User notifications
- **UserSession** - Session tracking

---

## 🔄 Business Logic & Workflows

### Stock-In Workflow (Model 19)

```
1. Create Transaction
   ↓
2. Validate Item Exists
   ↓
3. Generate/Validate Voucher Number (M19-XXXX)
   ↓
4. Calculate Total Price
   ↓
5. Begin Database Transaction
   ↓
6. Create Transaction Record
   ↓
7. Update Item Quantity (+)
   ↓
8. Check Reorder Level
   ↓
9. Create Audit Log
   ↓
10. Commit Transaction
```

### Stock-Out Workflow (Model 20)

```
1. Create Transaction
   ↓
2. Validate Item Exists
   ↓
3. Check Sufficient Stock
   ↓
4. Generate/Validate Voucher Number (M20-XXXX)
   ↓
5. Begin Database Transaction
   ↓
6. Create Transaction Record
   ↓
7. Update Item Quantity (-)
   ↓
8. Check Reorder Level → Notify if Low
   ↓
9. Create Audit Log
   ↓
10. Commit Transaction
```

### Low Stock Alert System

```
Trigger: Item quantity ≤ Reorder Level
   ↓
Get All Admin & Manager Users
   ↓
Create Notification for Each
   ↓
Log Alert Event
```

---

## 🛡️ Error Handling Strategy

### Custom Error Classes

```typescript
AppError               - Base error class
├── ValidationError    - Input validation failures
├── AuthenticationError - Authentication failures
├── AuthorizationError - Permission denied
├── NotFoundError      - Resource not found
├── ConflictError      - Duplicate/conflict errors
├── DatabaseError      - Database operation failures
└── BusinessRuleError  - Business logic violations
```

### Error Response Format

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "fields": {  // For validation errors
      "fieldName": "Field-specific error"
    },
    "timestamp": "2026-10-11T18:00:00.000Z",
    "path": "/api/items"
  }
}
```

---

## 📝 Logging & Monitoring

### Log Levels

- **DEBUG** - Development debugging information
- **INFO** - General information messages
- **WARN** - Warning messages
- **ERROR** - Error messages with stack traces
- **FATAL** - Critical errors
- **AUDIT** - Security-sensitive operations

### Log Format (JSON)

```json
{
  "timestamp": "2026-10-11T18:00:00.000Z",
  "level": "INFO",
  "message": "User logged in",
  "context": {
    "userId": "clx...",
    "username": "AbeTech",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Audit Events

- USER_CREATED, USER_UPDATED, USER_DEACTIVATED
- USER_LOGIN, USER_LOGOUT, PASSWORD_CHANGED
- ITEM_CREATED, ITEM_UPDATED, ITEM_ARCHIVED
- TRANSACTION_IN, TRANSACTION_OUT, TRANSACTION_CANCELLED
- And more...

---

## 🎯 API Design

### RESTful API Structure

```
/api
├── /auth
│   └── /[...nextauth]      - Authentication endpoints
├── /items
│   ├── GET                 - List items (paginated, filtered)
│   ├── POST                - Create item
│   ├── /[id]
│   │   ├── GET            - Get item details
│   │   ├── PUT            - Update item
│   │   └── DELETE         - Archive item
│   ├── /search            - Search items
│   ├── /low-stock         - Get low stock items
│   └── /statistics        - Get item statistics
├── /transactions
│   ├── GET                - List transactions
│   ├── POST               - Create transaction
│   ├── /[id]
│   │   ├── GET           - Get transaction details
│   │   └── DELETE        - Cancel transaction
│   ├── /statistics       - Get transaction statistics
│   └── /recent           - Get recent transactions
├── /users
│   ├── GET               - List users (Admin only)
│   ├── POST              - Create user (Admin only)
│   ├── /[id]
│   │   ├── GET          - Get user details
│   │   ├── PUT          - Update user
│   │   └── DELETE       - Deactivate user
│   └── /me              - Get current user profile
├── /maintenance
│   ├── GET              - List maintenance logs
│   ├── POST             - Create maintenance log
│   └── /[id]
│       └── GET          - Get maintenance details
└── /reports
    ├── /inventory       - Inventory report
    ├── /transactions    - Transaction report
    └── /maintenance     - Maintenance report
```

### Standard Response Format

**Success Response:**
```json
{
  "data": { /* response data */ },
  "pagination": {  // For paginated responses
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

---

## 🔧 Configuration Management

### Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite
# DATABASE_URL="postgresql://..."  # PostgreSQL for production

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Application
NODE_ENV="development"  # or "production"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Optional
ENABLE_DEBUG_LOGGING="true"
MAX_UPLOAD_SIZE="10485760"  # 10MB
SESSION_TIMEOUT="3600"  # 1 hour
```

### System Configuration (Database)

Stored in `SystemConfig` table for runtime configuration:

- SYSTEM_NAME
- ORGANIZATION_NAME
- CURRENCY
- LOW_STOCK_ALERT_ENABLED
- AUTO_VOUCHER_NUMBER
- EMAIL_NOTIFICATIONS_ENABLED
- etc.

---

## 📈 Performance Optimization

### Database Optimization

1. **Indexes** - Strategic indexing on:
   - User lookups (username, email, employeeId)
   - Item queries (category, condition, status, serialNumber)
   - Transaction queries (type, date, status, voucherNumber)
   - Audit logs (userId, action, timestamp)

2. **Query Optimization**
   - Use Prisma's `select` to limit returned fields
   - Implement pagination for large datasets
   - Use database transactions for data consistency

3. **Connection Pooling**
   - Prisma connection pooling
   - Singleton pattern for Prisma client

### API Optimization

1. **Rate Limiting** - In-memory rate limiting (100 requests/minute per IP)
2. **Caching** - Strategic caching of frequently accessed data
3. **Pagination** - Default limit of 50, max 100 items per page
4. **Field Selection** - Return only requested fields

---

## 🧪 Testing Strategy

### Unit Testing

- Service layer methods
- Validation logic
- Utility functions
- Business rule enforcement

### Integration Testing

- API endpoints
- Database transactions
- Authentication flows
- Authorization checks

### End-to-End Testing

- Complete workflows
- User journeys
- Cross-module interactions

---

## 🚀 Deployment Architecture

### Development Environment

```
Electron App (Local)
  ↓
Next.js Dev Server (localhost:3000)
  ↓
SQLite Database (file-based)
```

### Production Environment Options

**Option 1: Desktop Application (Electron)**
```
Electron Packaged App
  ↓
Embedded Next.js Server
  ↓
SQLite Database (bundled)
```

**Option 2: Web Application**
```
Load Balancer
  ↓
Next.js Servers (Multiple Instances)
  ↓
PostgreSQL Database (Primary + Replicas)
  ↓
Redis (Caching & Sessions)
```

---

## 🔮 Scalability Considerations

### Horizontal Scaling

- Stateless API design allows multiple server instances
- Session management via database or Redis
- Load balancer distribution

### Database Scaling

- **Read Replicas** for read-heavy operations
- **Connection Pooling** for efficient resource usage
- **Sharding** for very large datasets (future)

### Caching Strategy

- **Application Cache** - Redis for frequently accessed data
- **Query Cache** - Prisma query caching
- **Static Assets** - CDN for static resources

---

## 📦 Module Organization

```
default-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication
│   │   ├── items/         # Items API
│   │   ├── transactions/  # Transactions API
│   │   ├── users/         # Users API
│   │   └── reports/       # Reports API
│   ├── inventory/         # Inventory page
│   ├── stock-in/          # Stock-in page
│   ├── stock-out/         # Stock-out page
│   ├── reports/           # Reports page
│   └── login/             # Login page
├── components/            # React Components
│   ├── AppLayout.tsx
│   ├── Sidebar.tsx
│   └── [feature-components]/
├── lib/                   # Core Libraries
│   ├── services/          # Business Logic Services
│   │   ├── user.service.ts
│   │   ├── item.service.ts
│   │   └── transaction.service.ts
│   ├── middleware/        # API Middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── errors.ts          # Custom Error Classes
│   ├── logger.ts          # Logging Service
│   ├── validation.ts      # Input Validation
│   ├── prisma.ts          # Prisma Client
│   └── utils.ts           # Utility Functions
└── prisma/                # Database
    ├── schema.prisma      # Database Schema
    ├── seed.js            # Seed Data
    └── migrations/        # Database Migrations
```

---

## 🎓 Best Practices Implemented

### Code Quality

✅ TypeScript for type safety  
✅ ESLint for code quality  
✅ Prettier for code formatting  
✅ Modular architecture  
✅ Service layer separation  
✅ DRY principles  

### Security

✅ Secure password hashing  
✅ SQL injection prevention  
✅ XSS protection  
✅ CSRF protection  
✅ Input validation & sanitization  
✅ Role-based access control  
✅ Audit logging  

### Performance

✅ Database indexing  
✅ Query optimization  
✅ Pagination  
✅ Connection pooling  
✅ Rate limiting  

### Maintainability

✅ Clear code organization  
✅ Comprehensive documentation  
✅ Consistent naming conventions  
✅ Error handling  
✅ Logging & monitoring  

---

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **NextAuth.js Documentation**: https://next-auth.js.org
- **Electron Documentation**: https://www.electronjs.org/docs

---

**Built with ❤️ by AbeTech**  
*Enterprise-Grade Asset Management Solution*
