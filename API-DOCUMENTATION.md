# Asset Management System - API Documentation

**Version:** 2.0.0 Enterprise Edition  
**Base URL:** `http://localhost:3000/api` (Development)  
**Authentication:** Session-based (NextAuth.js)

---

## 🔐 Authentication

### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "username": "AbeTech",
  "password": "TechAbe@123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "clx...",
    "username": "AbeTech",
    "name": "Abraham Tekle",
    "email": "admin@abetech.com",
    "role": "ADMIN"
  }
}
```

### Logout
```http
POST /api/auth/signout
```

---

## 📦 Items API

### List Items
```http
GET /api/items?page=1&limit=50&category=Medical&status=ACTIVE&search=ultrasound
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50, max: 100) - Items per page
- `category` (string) - Filter by category
- `condition` (string) - Filter by condition (FUNCTIONAL, MAINTENANCE, DAMAGED, DISPOSED)
- `status` (string) - Filter by status (ACTIVE, ARCHIVED)
- `location` (string) - Filter by location
- `search` (string) - Search in name, serial number, barcode
- `lowStock` (boolean) - Show only low stock items
- `sortBy` (string) - Sort field
- `sortOrder` (asc|desc) - Sort direction

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Diagnostic Ultrasound Machine",
      "description": "High-resolution color Doppler ultrasound system",
      "category": "Medical Equipment",
      "unit": "unit",
      "quantity": 3,
      "reorderLevel": 1,
      "condition": "FUNCTIONAL",
      "status": "ACTIVE",
      "location": "OPD Room 4",
      "serialNumber": "USM-2024-001",
      "modelNumber": "GE-LOGIQ-P9",
      "manufacturer": "GE Healthcare",
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "purchasePrice": 250000.00,
      "warrantyExpiry": "2027-01-15T00:00:00.000Z",
      "barcode": "BAR-USM-001",
      "tags": "[\"medical\",\"diagnostic\",\"imaging\"]",
      "createdAt": "2026-10-11T18:00:00.000Z",
      "updatedAt": "2026-10-11T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Create Item
```http
POST /api/items
Content-Type: application/json

{
  "name": "Patient Monitor",
  "description": "15-inch multi-parameter patient monitoring system",
  "category": "Medical Equipment",
  "unit": "unit",
  "quantity": 5,
  "reorderLevel": 2,
  "condition": "FUNCTIONAL",
  "location": "ICU",
  "serialNumber": "PM-2024-001",
  "modelNumber": "PM-5000",
  "manufacturer": "Philips Healthcare",
  "purchaseDate": "2024-02-20",
  "purchasePrice": 5000.00,
  "warrantyExpiry": "2027-02-20",
  "barcode": "BAR-PM-001",
  "tags": "[\"medical\",\"monitoring\",\"icu\"]"
}
```

**Response (201 Created):**
```json
{
  "id": "clx...",
  "name": "Patient Monitor",
  // ... full item object
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "fields": {
      "name": "name is required",
      "quantity": "quantity must be at least 0"
    }
  }
}
```

### Get Item
```http
GET /api/items/[id]
```

**Response (200 OK):**
```json
{
  "id": "clx...",
  "name": "Diagnostic Ultrasound Machine",
  // ... full item object with relations
  "transactions": [...],
  "maintenanceLogs": [...]
}
```

### Update Item
```http
PUT /api/items/[id]
Content-Type: application/json

{
  "quantity": 10,
  "condition": "MAINTENANCE",
  "location": "OPD Room 5"
}
```

**Response (200 OK):**
```json
{
  "id": "clx...",
  // ... updated item object
}
```

### Archive Item
```http
DELETE /api/items/[id]
```

**Response (204 No Content)**

### Get Low Stock Items
```http
GET /api/items/low-stock
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Digital Stethoscope",
      "quantity": 3,
      "reorderLevel": 5,
      "category": "Medical Equipment"
    }
  ]
}
```

### Get Item Statistics
```http
GET /api/items/statistics
```

**Response (200 OK):**
```json
{
  "totalItems": 150,
  "totalValue": 1500000.00,
  "lowStockCount": 5,
  "maintenanceCount": 3,
  "damagedCount": 1,
  "categories": [
    {
      "category": "Medical Equipment",
      "_count": { "id": 45 },
      "_sum": { "quantity": 120 }
    }
  ]
}
```

---

## 💼 Transactions API

### List Transactions
```http
GET /api/transactions?type=IN&startDate=2024-01-01&endDate=2024-12-31&page=1
```

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `type` (IN|OUT) - Transaction type
- `itemId` (string) - Filter by item
- `status` (string) - Filter by status
- `startDate` (ISO date) - Start date filter
- `endDate` (ISO date) - End date filter
- `department` (string) - Filter by department (for OUT)
- `supplier` (string) - Filter by supplier (for IN)
- `search` (string) - Search voucher, reference, supplier, department

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "clx...",
      "type": "IN",
      "quantity": 3,
      "unitPrice": 250000.00,
      "totalPrice": 750000.00,
      "currency": "ETB",
      "supplier": "International Med-Supplies Ltd",
      "invoiceNumber": "INV-2024-001",
      "purchaseOrderNumber": "PO-2024-001",
      "voucherNumber": "M19-0001",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "COMPLETED",
      "approvedBy": "Manager",
      "remarks": "Initial procurement for OPD expansion",
      "item": {
        "id": "clx...",
        "name": "Diagnostic Ultrasound Machine",
        "category": "Medical Equipment",
        "unit": "unit"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

### Create Transaction (Stock-In)
```http
POST /api/transactions
Content-Type: application/json

{
  "type": "IN",
  "itemId": "clx...",
  "quantity": 10,
  "unitPrice": 1200.00,
  "totalPrice": 12000.00,
  "supplier": "Global Tech Solutions",
  "invoiceNumber": "INV-2024-010",
  "purchaseOrderNumber": "PO-2024-005",
  "voucherNumber": "M19-0010",
  "date": "2024-10-11",
  "remarks": "New batch procurement",
  "approvedBy": "IT Manager"
}
```

**Response (201 Created):**
```json
{
  "id": "clx...",
  "type": "IN",
  "voucherNumber": "M19-0010",
  // ... full transaction object
  "item": {...}
}
```

### Create Transaction (Stock-Out)
```http
POST /api/transactions
Content-Type: application/json

{
  "type": "OUT",
  "itemId": "clx...",
  "quantity": 5,
  "department": "Administration",
  "requisitionNumber": "REQ-2024-015",
  "recipientName": "IT Department",
  "voucherNumber": "M20-0010",
  "date": "2024-10-11",
  "remarks": "Computer deployment for admin staff",
  "approvedBy": "Admin Manager"
}
```

**Business Rule Errors (422 Unprocessable Entity):**
```json
{
  "error": {
    "message": "Insufficient stock. Available: 3, Requested: 5",
    "code": "BUSINESS_RULE_ERROR",
    "statusCode": 422
  }
}
```

### Get Transaction
```http
GET /api/transactions/[id]
```

**Response (200 OK):**
```json
{
  "id": "clx...",
  "type": "IN",
  "voucherNumber": "M19-0001",
  // ... full transaction object
  "item": {...}
}
```

### Cancel Transaction
```http
DELETE /api/transactions/[id]
Content-Type: application/json

{
  "reason": "Incorrect quantity entered"
}
```

**Response (204 No Content)**

**Note:** Transactions can only be cancelled within 24 hours of creation.

### Get Transaction Statistics
```http
GET /api/transactions/statistics?startDate=2024-01-01&endDate=2024-12-31
```

**Response (200 OK):**
```json
{
  "totalTransactions": 150,
  "stockIn": {
    "count": 75,
    "totalQuantity": 500,
    "totalValue": 1250000.00
  },
  "stockOut": {
    "count": 75,
    "totalQuantity": 450
  }
}
```

### Get Recent Transactions
```http
GET /api/transactions/recent?limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "clx...",
      "type": "OUT",
      "voucherNumber": "M20-0010",
      "quantity": 5,
      "date": "2024-10-11T14:30:00.000Z",
      "item": {
        "name": "Dell OptiPlex Desktop",
        "category": "Electronics"
      }
    }
  ]
}
```

---

## 👤 Users API

### List Users (Admin Only)
```http
GET /api/users?role=STAFF&isActive=true&page=1
```

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `role` (string) - Filter by role
- `isActive` (boolean) - Filter by active status
- `search` (string) - Search username, name, email, employeeId

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "clx...",
      "username": "staff",
      "email": "staff@abetech.com",
      "name": "John Doe",
      "role": "STAFF",
      "department": "Warehouse",
      "position": "Store Keeper",
      "employeeId": "EMP-003",
      "isActive": true,
      "lastLoginAt": "2024-10-11T08:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

### Create User (Admin Only)
```http
POST /api/users
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@abetech.com",
  "password": "SecurePass@123",
  "role": "STAFF",
  "name": "New User",
  "firstName": "New",
  "lastName": "User",
  "department": "IT",
  "position": "IT Support",
  "employeeId": "EMP-005",
  "phone": "+251-91-123-4567"
}
```

**Response (201 Created):**
```json
{
  "id": "clx...",
  "username": "newuser",
  "email": "newuser@abetech.com",
  "role": "STAFF",
  // ... (password not returned)
}
```

### Get User
```http
GET /api/users/[id]
```

**Response (200 OK):**
```json
{
  "id": "clx...",
  "username": "staff",
  "email": "staff@abetech.com",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STAFF",
  "department": "Warehouse",
  "position": "Store Keeper",
  "employeeId": "EMP-003",
  "phone": "+251-91-123-4567",
  "isActive": true,
  "lastLoginAt": "2024-10-11T08:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-10-10T15:30:00.000Z"
}
```

### Update User
```http
PUT /api/users/[id]
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@abetech.com",
  "department": "Operations",
  "phone": "+251-91-999-8888"
}
```

**Response (200 OK):**
```json
{
  "id": "clx...",
  // ... updated user object
}
```

### Change Password
```http
POST /api/users/[id]/change-password
Content-Type: application/json

{
  "currentPassword": "Staff@123",
  "newPassword": "NewSecurePass@456"
}
```

**Response (204 No Content)**

### Deactivate User (Admin Only)
```http
DELETE /api/users/[id]
```

**Response (204 No Content)**

### Activate User (Admin Only)
```http
POST /api/users/[id]/activate
```

**Response (204 No Content)**

---

## 🔧 Maintenance API

### List Maintenance Logs
```http
GET /api/maintenance?itemId=clx...&status=COMPLETED
```

### Create Maintenance Log
```http
POST /api/maintenance
Content-Type: application/json

{
  "itemId": "clx...",
  "maintenanceType": "PREVENTIVE",
  "description": "Routine maintenance and calibration",
  "technicianName": "John Technician",
  "cost": 250.00,
  "completionDate": "2024-10-11",
  "status": "COMPLETED"
}
```

---

## 📊 Reports API

### Inventory Report
```http
GET /api/reports/inventory?category=Medical&format=json
```

### Transaction Report
```http
GET /api/reports/transactions?type=IN&startDate=2024-01-01&endDate=2024-12-31&format=pdf
```

**Query Parameters:**
- `type` (IN|OUT) - Transaction type
- `startDate` (ISO date) - Start date
- `endDate` (ISO date) - End date
- `format` (json|csv|pdf|excel) - Export format

---

## 🚨 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| AUTHENTICATION_ERROR | 401 | Authentication required or failed |
| AUTHORIZATION_ERROR | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT_ERROR | 409 | Duplicate resource or conflict |
| BUSINESS_RULE_ERROR | 422 | Business logic violation |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |

---

## 📝 Notes

### Auto-Generated Voucher Numbers

If `voucherNumber` is not provided:
- Stock-In: Auto-generates `M19-XXXX` (e.g., M19-0001, M19-0002)
- Stock-Out: Auto-generates `M20-XXXX` (e.g., M20-0001, M20-0002)

### Pagination

- Default page size: 50 items
- Maximum page size: 100 items
- Page numbers start at 1

### Date Formats

- ISO 8601 format: `2024-10-11T18:00:00.000Z`
- Date-only format: `2024-10-11`

### Currency

- Default: ETB (Ethiopian Birr)
- Configurable per transaction

---

**For support, contact:** admin@abetech.com
