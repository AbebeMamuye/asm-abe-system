-- CreateTable
CREATE TABLE "IssueVoucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNumber" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientId" TEXT,
    "department" TEXT,
    "requisitionNumber" TEXT,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,
    "remarks" TEXT,
    "issuedBy" TEXT,
    "approvedBy" TEXT,
    "storekeeperName" TEXT,
    "receivedBy" TEXT,
    "pageFrom" INTEGER,
    "pageTo" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "totalValue" REAL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);

-- CreateTable
CREATE TABLE "IssueVoucherItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL,
    "totalCost" REAL,
    "condition" TEXT,
    "pageFrom" INTEGER,
    "pageTo" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IssueVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "IssueVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IssueVoucher_voucherNumber_key" ON "IssueVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "IssueVoucher_voucherNumber_idx" ON "IssueVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "IssueVoucher_issueDate_idx" ON "IssueVoucher"("issueDate");

-- CreateIndex
CREATE INDEX "IssueVoucher_department_idx" ON "IssueVoucher"("department");

-- CreateIndex
CREATE INDEX "IssueVoucher_status_idx" ON "IssueVoucher"("status");

-- CreateIndex
CREATE INDEX "IssueVoucherItem_voucherId_idx" ON "IssueVoucherItem"("voucherId");

-- CreateIndex
CREATE INDEX "IssueVoucherItem_itemId_idx" ON "IssueVoucherItem"("itemId");
