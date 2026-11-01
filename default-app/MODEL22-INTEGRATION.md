# Model 22 (Issue Voucher) Integration - Complete Guide

## Overview
Model 22 is now fully integrated into your Asset Management System. This module handles **Issue Vouchers** - formal documentation for issuing/distributing assets and inventory items from the store to departments, individuals, or projects.

## What's New

### 1. Database Schema (✅ Migrated)
**New Tables:**
- `IssueVoucher` - Main voucher header with recipient and authorization info
- `IssueVoucherItem` - Line items for each issued asset/item

**Key Fields:**
- Voucher Number (unique identifier)
- Recipient Information (name, ID, department)
- Issue Date
- Authorization (issued by, approved by, storekeeper, received by)
- Status tracking (PENDING, APPROVED, COMPLETED, CANCELLED)
- Financial tracking (unit cost, total cost, currency)

### 2. API Endpoints

**`/api/model22`**

#### GET - Fetch Vouchers
Retrieves all issue vouchers with filtering options:
- `status` - Filter by status (PENDING, COMPLETED, etc.)
- `department` - Filter by department
- `dateFrom` - Start date filter
- `dateTo` - End date filter

**Example:**
```
GET /api/model22?status=COMPLETED&department=IT
```

#### POST - Create Voucher
Creates a new issue voucher with automatic:
- Inventory quantity updates (decrements issued items)
- Transaction record creation
- Audit log entry
- Total value calculation

**Example Payload:**
```json
{
  "voucherNumber": "M22-202610-1234",
  "recipientName": "John Doe",
  "department": "IT Department",
  "issueDate": "2026-10-17",
  "purpose": "Office Equipment",
  "items": [
    {
      "itemId": "item_abc123",
      "itemName": "Laptop Dell",
      "unit": "PCS",
      "quantity": 2,
      "unitCost": 45000,
      "condition": "NEW"
    }
  ]
}
```

### 3. User Interface

**Page: `/model22`**

**Features:**
- 📋 **Voucher Creation Form**
  - Auto-generated voucher numbers
  - Recipient and department tracking
  - Multiple items per voucher
  - Real-time total calculation
  - Unit selection (PCS, BOX, KG, L, M, SET)
  
- 📊 **Vouchers History Table**
  - Sortable columns
  - Status indicators
  - Total value display
  - Quick view of all vouchers

- ✨ **Smart Features**
  - Auto voucher number generation: `M22-{YYYYMM}-{XXXX}`
  - Dynamic item addition/removal
  - Cost calculation: `quantity × unit cost`
  - Validation before submission

### 4. Navigation Integration
- Added "Model 22 (Issue)" link in sidebar
- Icon: PlusCircle
- Direct access from main navigation

### 5. Automatic Inventory Updates
When a Model 22 voucher is created:
1. ✅ Inventory quantities automatically decrease
2. ✅ Transaction records created (type: "OUT")
3. ✅ Audit trail logged
4. ✅ Financial tracking updated

## How to Use Model 22

### Creating an Issue Voucher

1. **Navigate** to Model 22 page (from sidebar)
2. **Click** "+ New Issue Voucher" button
3. **Fill in voucher details:**
   - Voucher Number (auto-generated, editable)
   - Issue Date
   - Recipient Name (required)
   - Department
   - Purpose
   - Authorization fields

4. **Add items:**
   - Enter item name
   - Select unit
   - Enter quantity
   - Enter unit cost (optional)
   - Click "+ Add Item"

5. **Review** items list and total value
6. **Click** "Create Issue Voucher" to submit

### Viewing Vouchers
- All vouchers display in the history table
- See voucher number, date, recipient, department, item count, and total value
- Status badge shows current state (COMPLETED, PENDING, etc.)

## Technical Details

### Database Relationships
```
IssueVoucher (1) ← → (Many) IssueVoucherItem
IssueVoucher → Updates → Item.quantity
IssueVoucher → Creates → Transaction (type: OUT)
IssueVoucher → Logs → AuditLog
```

### Status Workflow
```
PENDING → APPROVED → COMPLETED
             ↓
          CANCELLED
```

### Security
- ✅ Authentication required (NextAuth)
- ✅ Audit logging for all operations
- ✅ User tracking (createdBy fields)
- ✅ Session validation on API calls

## Integration with Existing Features

### Model 19 (Receiving) & Model 20 (Requisition)
Model 22 complements:
- **Model 19**: Records stock coming IN
- **Model 20**: Records requisitions/requests
- **Model 22**: Records stock going OUT with full details

### Transaction System
- All Model 22 vouchers create Transaction records
- Type: "OUT"
- Links to Item for inventory tracking
- Financial details captured

### Reports
Model 22 data feeds into:
- Stock movement reports
- Department consumption reports
- Financial reports
- Audit trails

## Compliance & Standards

**Model 22 Format:**
- Ethiopian Asset Management Standards
- ANRS Property Management Guidelines
- Financial tracking requirements
- Audit trail requirements

**Document Tracking:**
- Page numbers (from/to) support
- Reference numbers
- Approval signatures
- Recipient acknowledgment

## Future Enhancements (Potential)

- 📄 PDF export of vouchers
- 🔍 Advanced search and filtering
- 📊 Model 22 specific reports
- ✅ Digital signature capture
- 📧 Email notifications
- 🔐 Multi-level approval workflow
- 📱 Mobile-responsive improvements

## System Status

✅ **Database Schema:** Migrated and ready  
✅ **API Endpoints:** Functional (/api/model22)  
✅ **UI Pages:** Complete (/model22)  
✅ **Navigation:** Integrated  
✅ **Inventory Updates:** Automatic  
✅ **Audit Logging:** Active  
✅ **Server:** Running on http://localhost:8080  

## Troubleshooting

**Issue:** "Unauthorized" error
- **Solution:** Ensure you're logged in (AbeTech/TechAbe@123)

**Issue:** Item quantity not decreasing
- **Solution:** Verify itemId is provided when adding items

**Issue:** Voucher creation fails
- **Solution:** Check required fields (voucherNumber, recipientName, at least 1 item)

## Access Information

**URL:** http://localhost:8080/model22  
**Login:** AbeTech / TechAbe@123  
**Navigation:** Sidebar → "Model 22 (Issue)"  

---

**System Version:** 2.0 (with Model 22)  
**Last Updated:** October 17, 2026  
**Integration Status:** ✅ COMPLETE
