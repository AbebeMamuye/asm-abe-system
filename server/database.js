const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

let db;

function initDatabase() {
  const dbDir = path.join(os.homedir(), 'AppData', 'Roaming', 'asset-management-ims');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'property-management.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Same schema from database.ts
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      fundSource TEXT NOT NULL DEFAULT 'Budget',
      quantity INTEGER DEFAULT 0,
      unitCost REAL DEFAULT 0,
      unit TEXT DEFAULT 'Piece',
      location TEXT DEFAULT '',
      condition TEXT DEFAULT 'Functional',
      serialNumber TEXT,
      supplier TEXT,
      purchaseDate TEXT,
      expiryDate TEXT,
      usefulLife INTEGER DEFAULT 5,
      salvageValue REAL DEFAULT 0,
      lastUpdated TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'Guest',
      avatar TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  const assetCols = [
    'purchaseDate TEXT',
    'expiryDate TEXT',
    'usefulLife INTEGER DEFAULT 5',
    'salvageValue REAL DEFAULT 0',
    'tagNumber TEXT',
    'custodian TEXT',
    'department TEXT',
    "disposalStatus TEXT DEFAULT 'Active'",
    'disposalMethod TEXT',
    'disposalDate TEXT',
    'disposalValue REAL DEFAULT 0'
  ];
  for (const col of assetCols) {
    try {
      db.exec(`ALTER TABLE assets ADD COLUMN ${col}`);
    } catch (e) {}
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscalYear TEXT NOT NULL,
      countDate TEXT NOT NULL,
      committeeChair TEXT NOT NULL,
      committeeMembers TEXT NOT NULL,
      status TEXT DEFAULT 'In Progress',
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_count_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      countId INTEGER NOT NULL,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      systemQty INTEGER NOT NULL,
      countedQty INTEGER NOT NULL,
      discrepancy INTEGER NOT NULL,
      discrepancyType TEXT NOT NULL,
      condition TEXT DEFAULT 'Functional',
      remarks TEXT,
      FOREIGN KEY (countId) REFERENCES inventory_counts (id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS disposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      disposalMethod TEXT NOT NULL,
      disposalDate TEXT NOT NULL,
      committeeLeader TEXT NOT NULL,
      approvedBy TEXT NOT NULL,
      reason TEXT,
      recoveredAmount REAL DEFAULT 0,
      status TEXT DEFAULT 'Completed',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Guest'`);
  } catch (e) {
    // Ignore error if column already exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers_model19 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherNumber TEXT NOT NULL UNIQUE,
      receivedFrom TEXT NOT NULL,
      receivedDate TEXT NOT NULL,
      storeNo TEXT,
      shelfNo TEXT,
      classification TEXT,
      expenditureNo TEXT,
      incomingNo TEXT,
      approvedBy TEXT,
      receivedBy TEXT,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers_model20 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherNumber TEXT NOT NULL UNIQUE,
      issuedTo TEXT NOT NULL,
      department TEXT NOT NULL,
      issuedDate TEXT NOT NULL,
      requestedBy TEXT,
      authorizedBy TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers_model22 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherNumber TEXT NOT NULL UNIQUE,
      recipientName TEXT NOT NULL,
      issueDate TEXT NOT NULL,
      storekeeperName TEXT,
      pageFrom TEXT,
      pageTo TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS voucher_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherId INTEGER NOT NULL,
      voucherType TEXT NOT NULL,
      assetId INTEGER,
      assetName TEXT NOT NULL,
      model TEXT,
      serial TEXT,
      pageFrom TEXT,
      pageTo TEXT,
      unit TEXT,
      quantity INTEGER NOT NULL,
      unitCost REAL DEFAULT 0,
      totalCost REAL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER,
      assetName TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      voucherRef TEXT,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN note TEXT`);
  } catch (e) {
    // Column might already exist
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      issueDescription TEXT NOT NULL,
      status TEXT DEFAULT 'Reported',
      reportedDate TEXT DEFAULT (date('now')),
      completedDate TEXT,
      technicianName TEXT,
      cost REAL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      requestedBy TEXT NOT NULL,
      department TEXT,
      description TEXT,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      reviewedBy TEXT,
      reviewNote TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      reviewedAt TEXT
    )
  `);

  // AMIS User columns
  const userCols = [
    "phone TEXT",
    "position TEXT",
    "locationCode TEXT",
    "departmentCode TEXT",
    "forcePasswordChange INTEGER DEFAULT 0"
  ];
  for (const col of userCols) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col}`);
    } catch (e) {}
  }

  // AMIS Hierarchy table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_hierarchies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      userName TEXT NOT NULL,
      userPhone TEXT,
      position TEXT,
      departmentCode TEXT,
      supervisorId INTEGER,
      supervisorName TEXT,
      supervisorPhone TEXT,
      storeKeeperId INTEGER,
      storeKeeperName TEXT,
      storeKeeperPhone TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // AMIS Asset Transfers table (የንብረት ዝውውር)
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      tagNumber TEXT,
      fromUserId INTEGER,
      fromUserName TEXT NOT NULL,
      toUserId INTEGER,
      toUserName TEXT NOT NULL,
      department TEXT,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      transferDate TEXT DEFAULT (datetime('now')),
      responseDate TEXT,
      note TEXT
    )
  `);

  // AMIS Consumable Allocations table (አላቂ እቃ ማከፋፈል)
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumable_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      departmentCode TEXT NOT NULL,
      allocatedQty INTEGER NOT NULL,
      allocatedDate TEXT DEFAULT (date('now')),
      approvedBy TEXT
    )
  `);

  seedAmisData();

  return db;
}

// ─── USER HANDLERS ──────────────────────────────────────────
function registerUser(user) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, position, locationCode, departmentCode, avatar, forcePasswordChange)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  try {
    const result = stmt.run(
      user.name,
      user.email,
      user.phone || null,
      user.password || null,
      user.role || 'Guest',
      user.position || null,
      user.locationCode || null,
      user.departmentCode || null,
      user.avatar || null,
      user.forcePasswordChange || 0
    );
    return { success: true, id: result.lastInsertRowid };
  } catch (err) {
    return { success: false, error: 'User already registered' };
  }
}
function getAllUsers() { 
  return db.prepare('SELECT id, name, email, phone, role, position, locationCode, departmentCode, avatar, forcePasswordChange, createdAt FROM users ORDER BY createdAt DESC').all(); 
}
function getUserByEmail(credential) {
  if (!credential) return null;
  const clean = credential.trim();
  return db.prepare(`
    SELECT * FROM users 
    WHERE lower(email) = lower(?) 
       OR lower(name) = lower(?) 
       OR phone = ?
       OR replace(phone, ' ', '') = ?
  `).get(clean, clean, clean, clean);
}
function changeUserPassword(userId, newPassword) {
  try {
    db.prepare(`UPDATE users SET password = ?, forcePasswordChange = 0 WHERE id = ?`).run(newPassword, userId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── ASSET HANDLERS ─────────────────────────────────────────
function getAllAssets() {
  return db
    .prepare('SELECT *, (quantity * unitCost) as totalValue FROM assets ORDER BY lastUpdated DESC')
    .all()
    .map((a) => ({
      ...a,
      tagNumber: a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
      custodian: a.custodian || '',
      department: a.department || '',
      disposalStatus: a.disposalStatus || 'Active'
    }));
}
function addAsset(asset) {
  const stmt = db.prepare(`
    INSERT INTO assets (
      name, category, fundSource, quantity, unit, unitCost, location, condition,
      serialNumber, supplier, purchaseDate, expiryDate, usefulLife, salvageValue,
      tagNumber, custodian, department, disposalStatus, disposalMethod, disposalDate, disposalValue
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    asset.name,
    asset.category,
    asset.fundSource,
    asset.quantity,
    asset.unit,
    asset.unitCost,
    asset.location,
    asset.condition,
    asset.serialNumber,
    asset.supplier,
    asset.purchaseDate,
    asset.expiryDate,
    asset.usefulLife || 5,
    asset.salvageValue || 0,
    asset.tagNumber || null,
    asset.custodian || null,
    asset.department || null,
    asset.disposalStatus || 'Active',
    asset.disposalMethod || null,
    asset.disposalDate || null,
    asset.disposalValue || 0
  );
  const assetId = result.lastInsertRowid;
  if (!asset.tagNumber) {
    const generatedTag = `ETH-AMS-${assetId.toString().padStart(5, '0')}`;
    db.prepare('UPDATE assets SET tagNumber = ? WHERE id = ?').run(generatedTag, assetId);
  }
  if (asset.quantity > 0) {
    db.prepare(
      `INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'RECEIVED', ?, ?, ?)`
    ).run(assetId, asset.name, asset.quantity, 'INITIAL', 'Initial stock registration');
  }
  return { id: assetId };
}
function updateAsset(id, asset) {
  const stmt = db.prepare(`
    UPDATE assets SET
      name=?, category=?, fundSource=?, quantity=?, unit=?, unitCost=?, location=?,
      condition=?, serialNumber=?, supplier=?, purchaseDate=?, expiryDate=?, usefulLife=?,
      salvageValue=?, tagNumber=?, custodian=?, department=?, disposalStatus=?,
      disposalMethod=?, disposalDate=?, disposalValue=?, lastUpdated=datetime('now')
    WHERE id=?
  `);
  const result = stmt.run(
    asset.name,
    asset.category,
    asset.fundSource,
    asset.quantity,
    asset.unit,
    asset.unitCost,
    asset.location,
    asset.condition,
    asset.serialNumber,
    asset.supplier,
    asset.purchaseDate,
    asset.expiryDate,
    asset.usefulLife || 5,
    asset.salvageValue || 0,
    asset.tagNumber || `ETH-AMS-${id.toString().padStart(5, '0')}`,
    asset.custodian || '',
    asset.department || '',
    asset.disposalStatus || 'Active',
    asset.disposalMethod || null,
    asset.disposalDate || null,
    asset.disposalValue || 0,
    id
  );
  return { changes: result.changes };
}
function deleteAsset(id) { return db.prepare('DELETE FROM assets WHERE id=?').run(id); }

// ─── VOUCHER HANDLERS ───────────────────────────────────────
function createVoucherM19(voucher) {
  const vId = db.prepare(`INSERT INTO vouchers_model19 (voucherNumber, receivedFrom, receivedDate, storeNo, shelfNo, classification, expenditureNo, incomingNo, approvedBy, receivedBy, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(voucher.voucherNumber, voucher.receivedFrom, voucher.receivedDate, voucher.storeNo, voucher.shelfNo, voucher.classification, voucher.expenditureNo, voucher.incomingNo, voucher.approvedBy, voucher.receivedBy, voucher.note).lastInsertRowid;
  for (const item of voucher.items) {
    db.prepare(`
    INSERT INTO voucher_items (voucherId, voucherType, assetId, assetName, model, serial, pageFrom, pageTo, unit, quantity, unitCost, totalCost)
    VALUES (?, 'MODEL19', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    vId, item.assetId || null, item.assetName, 
    item.model || null, item.serial || null, item.pageFrom || null, item.pageTo || null,
    item.unit, item.quantity, item.unitCost, item.totalCost
  );
    if (item.assetId) db.prepare(`UPDATE assets SET quantity = quantity + ? WHERE id = ?`).run(item.quantity, item.assetId);
    db.prepare(`INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'RECEIVED', ?, ?, ?)`).run(item.assetId, item.assetName, item.quantity, voucher.voucherNumber, voucher.note || 'M19 Receipt');
  }
  return { success: true };
}
function createVoucherM20(voucher) {
  const vId = db.prepare(`INSERT INTO vouchers_model20 (voucherNumber, issuedTo, department, issuedDate, requestedBy, authorizedBy) VALUES (?, ?, ?, ?, ?, ?)`).run(voucher.voucherNumber, voucher.issuedTo, voucher.department, voucher.issuedDate, voucher.requestedBy, voucher.authorizedBy).lastInsertRowid;
  for (const item of voucher.items) {
    db.prepare(`
      INSERT INTO voucher_items (voucherId, voucherType, assetId, assetName, model, serial, pageFrom, pageTo, unit, quantity, unitCost, totalCost)
      VALUES (?, 'MODEL20', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vId, item.assetId || null, item.assetName, 
      item.model || null, item.serial || null, item.pageFrom || null, item.pageTo || null,
      item.unit, item.quantity, item.unitCost, item.totalCost
    );
    if (item.assetId) db.prepare(`UPDATE assets SET quantity = quantity - ? WHERE id = ?`).run(item.quantity, item.assetId);
    db.prepare(`INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'REQUISITION', ?, ?, ?)`).run(item.assetId, item.assetName, item.quantity, voucher.voucherNumber, `Requested by ${voucher.requestedBy}`);
  }
  return { success: true };
}
function createVoucherM22(voucher) {
  const vId = db.prepare(`INSERT INTO vouchers_model22 (voucherNumber, recipientName, issueDate, storekeeperName, pageFrom, pageTo) VALUES (?, ?, ?, ?, ?, ?)`).run(voucher.voucherNumber, voucher.recipientName, voucher.issueDate, voucher.storekeeperName, voucher.pageFrom, voucher.pageTo).lastInsertRowid;
  for (const item of voucher.items) {
    db.prepare(`
      INSERT INTO voucher_items (voucherId, voucherType, assetId, assetName, model, serial, pageFrom, pageTo, unit, quantity, unitCost, totalCost)
      VALUES (?, 'MODEL22', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vId, item.assetId || null, item.assetName, 
      item.model || null, item.serial || null, item.pageFrom || null, item.pageTo || null,
      item.unit, item.quantity, item.unitCost, item.totalCost
    );
    if (item.assetId) db.prepare(`UPDATE assets SET quantity = quantity - ? WHERE id = ?`).run(item.quantity, item.assetId);
    db.prepare(`INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'ISSUED', ?, ?, ?)`).run(item.assetId, item.assetName, item.quantity, voucher.voucherNumber, `Issued to ${voucher.recipientName}`);
  }
  return { success: true };
}
function getAllVouchersM19() {
  const vs = db.prepare("SELECT * FROM vouchers_model19 ORDER BY createdAt DESC").all();
  return vs.map(v => ({ ...v, items: db.prepare("SELECT * FROM voucher_items WHERE voucherId=? AND voucherType='MODEL19'").all(v.id) }));
}
function getAllVouchersM20() {
  const vs = db.prepare("SELECT * FROM vouchers_model20 ORDER BY createdAt DESC").all();
  return vs.map(v => ({ ...v, items: db.prepare("SELECT * FROM voucher_items WHERE voucherId=? AND voucherType='MODEL20'").all(v.id) }));
}
function getAllVouchersM22() {
  const vs = db.prepare("SELECT * FROM vouchers_model22 ORDER BY createdAt DESC").all();
  return vs.map(v => ({ ...v, items: db.prepare("SELECT * FROM voucher_items WHERE voucherId=? AND voucherType='MODEL22'").all(v.id) }));
}
function getNextVoucherNumber(type) {
  const tableMap = { MODEL19: 'vouchers_model19', MODEL20: 'vouchers_model20', MODEL22: 'vouchers_model22' };
  const prefixMap = { MODEL19: 'RCV', MODEL20: 'REQ', MODEL22: 'ISS' };
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableMap[type]}`).get();
    return `${prefixMap[type]}-${new Date().getFullYear()}-${(row.count + 1).toString().padStart(5, '0')}`;
  } catch { return `${prefixMap[type]}-${new Date().getFullYear()}-00001`; }
}

// ─── ANALYTICS, TRANSACTIONS & MAINTENANCE ──────────────────
function getDashboardStats() {
  const totalAssetsNum = db.prepare('SELECT COUNT(*) as count FROM assets').get();
  const totalValueNum = db.prepare('SELECT SUM(quantity * unitCost) as val FROM assets').get();
  const functionalNum = db.prepare("SELECT COUNT(*) as count FROM assets WHERE condition='Functional'").get();
  const nonFunctionalNum = db.prepare("SELECT COUNT(*) as count FROM assets WHERE condition='Non-functional'").get();
  const categoriesTable = db.prepare("SELECT category, COUNT(*) as count FROM assets GROUP BY category").all();
  return { totalAssets: totalAssetsNum.count, totalValue: totalValueNum.val || 0, functional: functionalNum.count, nonFunctional: nonFunctionalNum.count, categories: categoriesTable };
}
function getAllTransactions() { return db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC LIMIT 50').all(); }
function getMaintenanceLogs() { return db.prepare("SELECT m.*, a.name as assetName FROM maintenance_logs m LEFT JOIN assets a ON m.assetId = a.id ORDER BY m.reportedDate DESC").all(); }
function addMaintenance(log) {
  const stmt = db.prepare(`INSERT INTO maintenance_logs (assetId, issueDescription, status, reportedDate, technicianName, cost) VALUES (?, ?, ?, ?, ?, ?)`);
  return stmt.run(log.assetId, log.issueDescription, log.status || 'Reported', log.reportedDate || new Date().toISOString().split('T')[0], log.technicianName || null, log.cost || 0);
}
function updateMaintenance(id, updates) {
  const fields = []; const values = [];
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.technicianName !== undefined) { fields.push('technicianName = ?'); values.push(updates.technicianName); }
  if (updates.completedDate !== undefined) { fields.push('completedDate = ?'); values.push(updates.completedDate); }
  if (updates.cost !== undefined) { fields.push('cost = ?'); values.push(updates.cost); }
  if (fields.length === 0) return { changes: 0 };
  values.push(id);
  return db.prepare(`UPDATE maintenance_logs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

function getDbPath() {
  return path.join(os.homedir(), 'AppData', 'Roaming', 'asset-management-ims', 'property-management.db');
}

function resetDatabase() {
  db.exec('DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS assets; DROP TABLE IF EXISTS vouchers_model19; DROP TABLE IF EXISTS vouchers_model20; DROP TABLE IF EXISTS vouchers_model22; DROP TABLE IF EXISTS voucher_items; DROP TABLE IF EXISTS transactions; DROP TABLE IF EXISTS maintenance_logs; DROP TABLE IF EXISTS pending_requests; DROP TABLE IF EXISTS inventory_count_items; DROP TABLE IF EXISTS inventory_counts; DROP TABLE IF EXISTS disposals;');
  initDatabase();
  return { success: true };
}

// ─── INVENTORY COUNTS (ANNUAL VERIFICATION & RECONCILIATION) ─
function getAllInventoryCounts() {
  const counts = db.prepare('SELECT * FROM inventory_counts ORDER BY createdAt DESC').all();
  return counts.map((c) => ({
    ...c,
    items: db.prepare('SELECT * FROM inventory_count_items WHERE countId = ?').all(c.id)
  }));
}

function getInventoryCountById(id) {
  const count = db.prepare('SELECT * FROM inventory_counts WHERE id = ?').get(id);
  if (!count) return null;
  count.items = db.prepare('SELECT * FROM inventory_count_items WHERE countId = ?').all(id);
  return count;
}

function createInventoryCount(data) {
  const stmt = db.prepare(`
    INSERT INTO inventory_counts (fiscalYear, countDate, committeeChair, committeeMembers, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.fiscalYear || `${new Date().getFullYear()} E.C.`,
    data.countDate || new Date().toISOString().split('T')[0],
    data.committeeChair || 'Committee Chair',
    data.committeeMembers || '',
    data.status || 'Completed',
    data.notes || ''
  );
  const countId = result.lastInsertRowid;

  if (Array.isArray(data.items)) {
    const itemStmt = db.prepare(`
      INSERT INTO inventory_count_items (countId, assetId, assetName, systemQty, countedQty, discrepancy, discrepancyType, condition, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of data.items) {
      const disc = Number(item.countedQty) - Number(item.systemQty);
      let discType = 'Match';
      if (disc < 0) discType = 'Shortage';
      else if (disc > 0) discType = 'Surplus';
      if (item.condition === 'Damaged' || item.condition === 'Non-functional') discType = 'Damaged';

      itemStmt.run(
        countId,
        item.assetId,
        item.assetName,
        item.systemQty,
        item.countedQty,
        disc,
        discType,
        item.condition || 'Functional',
        item.remarks || ''
      );

      if (data.status === 'Reconciled' && disc !== 0) {
        db.prepare('UPDATE assets SET quantity = ?, lastUpdated = datetime(\'now\') WHERE id = ?').run(item.countedQty, item.assetId);
        db.prepare(`
          INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          item.assetId,
          item.assetName,
          disc < 0 ? 'ISSUED' : 'RECEIVED',
          Math.abs(disc),
          `COUNT-${data.fiscalYear || new Date().getFullYear()}`,
          `Annual Count Reconciliation: ${discType} (${disc >= 0 ? '+' : ''}${disc})`
        );
      }
    }
  }
  return { success: true, id: countId };
}

// ─── DISPOSAL HANDLERS (ASSET DECOMMISSIONING) ───────────────
function getAllDisposals() {
  return db.prepare('SELECT * FROM disposals ORDER BY createdAt DESC').all();
}

function createDisposal(data) {
  const stmt = db.prepare(`
    INSERT INTO disposals (assetId, assetName, quantity, disposalMethod, disposalDate, committeeLeader, approvedBy, reason, recoveredAmount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.assetId,
    data.assetName,
    data.quantity,
    data.disposalMethod,
    data.disposalDate || new Date().toISOString().split('T')[0],
    data.committeeLeader || '',
    data.approvedBy || '',
    data.reason || '',
    data.recoveredAmount || 0,
    data.status || 'Completed'
  );

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(data.assetId);
  if (asset) {
    const newQty = Math.max(0, asset.quantity - data.quantity);
    const newCond = newQty === 0 ? 'Disposed' : asset.condition;
    db.prepare(`
      UPDATE assets SET
        quantity = ?,
        condition = ?,
        disposalStatus = 'Disposed',
        disposalMethod = ?,
        disposalDate = ?,
        disposalValue = ?,
        lastUpdated = datetime('now')
      WHERE id = ?
    `).run(
      newQty,
      newCond,
      data.disposalMethod,
      data.disposalDate || new Date().toISOString().split('T')[0],
      data.recoveredAmount || 0,
      data.assetId
    );

    db.prepare(`
      INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
      VALUES (?, ?, 'ISSUED', ?, ?, ?)
    `).run(
      data.assetId,
      data.assetName,
      data.quantity,
      `DISP-${data.disposalMethod.replace(/\\s+/g, '')}`,
      `Asset Disposed via ${data.disposalMethod}. Reason: ${data.reason || 'Decommissioned'}`
    );
  }

  return { success: true, id: result.lastInsertRowid };
}

module.exports = {
  initDatabase, registerUser, getAllUsers, getUserByEmail, changeUserPassword,
  getAllAssets, addAsset, updateAsset, deleteAsset,
  createVoucherM19, createVoucherM20, createVoucherM22,
  getAllVouchersM19, getAllVouchersM20, getAllVouchersM22, getNextVoucherNumber,
  getDashboardStats, getAllTransactions, getMaintenanceLogs, addMaintenance, updateMaintenance,
  getDbPath, resetDatabase,
  // Pending Requests
  createPendingRequest, getPendingRequests, reviewPendingRequest,
  // Inventory Counts & Disposals
  getAllInventoryCounts, getInventoryCountById, createInventoryCount,
  getAllDisposals, createDisposal,
  // AMIS Features
  getAllHierarchies, createHierarchy, deleteHierarchy,
  getAllTransfers, createTransfer, respondTransfer,
  getAllAllocations, createAllocation, seedAmisData
};

function createPendingRequest(req) {
  const stmt = db.prepare(`INSERT INTO pending_requests (type, requestedBy, department, description, payload) VALUES (?, ?, ?, ?, ?)`);
  const result = stmt.run(req.type, req.requestedBy, req.department || '', req.description || '', JSON.stringify(req.payload));
  return { success: true, id: result.lastInsertRowid };
}
function getPendingRequests(status) {
  if (status) return db.prepare(`SELECT * FROM pending_requests WHERE status = ? ORDER BY createdAt DESC`).all(status);
  return db.prepare(`SELECT * FROM pending_requests ORDER BY createdAt DESC`).all();
}
function reviewPendingRequest(id, action, reviewedBy, reviewNote) {
  const row = db.prepare(`SELECT * FROM pending_requests WHERE id = ?`).get(id);
  if (!row || row.status !== 'Pending') return { success: false, error: 'Request not found or already reviewed' };
  
  try {
    db.transaction(() => {
      db.prepare(`UPDATE pending_requests SET status = ?, reviewedBy = ?, reviewNote = ?, reviewedAt = datetime('now') WHERE id = ?`)
        .run(action, reviewedBy, reviewNote || '', id);
        
      if (action === 'Approved') {
        const payload = JSON.parse(row.payload);
        if (row.type === 'Requisition') createVoucherM20(payload);
        else if (row.type === 'Stock-In') createVoucherM19(payload);
        else if (row.type === 'Issue') createVoucherM22(payload);
      }
    })();
    return { success: true };
  } catch (err) {
    console.error('Review process error:', err);
    return { success: false, error: err.message || 'Error processing request authorization' };
  }
}

// ─── AMIS HIERARCHIES (ትስስር መፍጠር) ─────────────────────────
function getAllHierarchies() {
  return db.prepare('SELECT * FROM user_hierarchies ORDER BY createdAt DESC').all();
}

function createHierarchy(data) {
  const stmt = db.prepare(`
    INSERT INTO user_hierarchies (userId, userName, userPhone, position, departmentCode, supervisorId, supervisorName, supervisorPhone, storeKeeperId, storeKeeperName, storeKeeperPhone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET
      userName = excluded.userName,
      userPhone = excluded.userPhone,
      position = excluded.position,
      departmentCode = excluded.departmentCode,
      supervisorId = excluded.supervisorId,
      supervisorName = excluded.supervisorName,
      supervisorPhone = excluded.supervisorPhone,
      storeKeeperId = excluded.storeKeeperId,
      storeKeeperName = excluded.storeKeeperName,
      storeKeeperPhone = excluded.storeKeeperPhone
  `);
  const result = stmt.run(
    data.userId,
    data.userName,
    data.userPhone || '',
    data.position || '',
    data.departmentCode || '',
    data.supervisorId || null,
    data.supervisorName || '',
    data.supervisorPhone || '',
    data.storeKeeperId || null,
    data.storeKeeperName || '',
    data.storeKeeperPhone || ''
  );
  return { success: true, id: result.lastInsertRowid };
}

function deleteHierarchy(id) {
  db.prepare('DELETE FROM user_hierarchies WHERE id = ?').run(id);
  return { success: true };
}

// ─── AMIS ASSET TRANSFERS (የንብረት ዝውውር) ─────────────────────
function getAllTransfers() {
  return db.prepare('SELECT * FROM asset_transfers ORDER BY transferDate DESC').all();
}

function createTransfer(data) {
  const stmt = db.prepare(`
    INSERT INTO asset_transfers (assetId, assetName, tagNumber, fromUserId, fromUserName, toUserId, toUserName, department, reason, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
  `);
  const result = stmt.run(
    data.assetId,
    data.assetName,
    data.tagNumber || '',
    data.fromUserId || null,
    data.fromUserName,
    data.toUserId || null,
    data.toUserName,
    data.department || '',
    data.reason,
    data.note || ''
  );

  db.prepare(`
    INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
    VALUES (?, ?, 'REQUISITION', 1, ?, ?)
  `).run(
    data.assetId,
    data.assetName,
    `XFER-REQ`,
    `Transfer requested by ${data.fromUserName} to ${data.toUserName}. Reason: ${data.reason}`
  );

  return { success: true, id: result.lastInsertRowid };
}

function respondTransfer(id, status, note) {
  const xfer = db.prepare('SELECT * FROM asset_transfers WHERE id = ?').get(id);
  if (!xfer) return { success: false, error: 'Transfer not found' };

  db.prepare(`
    UPDATE asset_transfers SET status = ?, responseDate = datetime('now'), note = ?
    WHERE id = ?
  `).run(status, note || '', id);

  if (status === 'Accepted') {
    db.prepare(`
      UPDATE assets SET custodian = ?, lastUpdated = datetime('now')
      WHERE id = ?
    `).run(xfer.toUserName, xfer.assetId);

    db.prepare(`
      INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
      VALUES (?, ?, 'RECEIVED', 1, ?, ?)
    `).run(
      xfer.assetId,
      xfer.assetName,
      `XFER-${xfer.id}`,
      `Peer Transfer ACCEPTED by ${xfer.toUserName}. Custody transferred.`
    );
  }

  return { success: true };
}

// ─── AMIS CONSUMABLE ALLOCATIONS (አላቂ እቃ ማከፋፈል) ────────────
function getAllAllocations() {
  return db.prepare('SELECT * FROM consumable_allocations ORDER BY allocatedDate DESC').all();
}

function createAllocation(data) {
  const stmt = db.prepare(`
    INSERT INTO consumable_allocations (assetId, assetName, departmentCode, allocatedQty, allocatedDate, approvedBy)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.assetId,
    data.assetName,
    data.departmentCode,
    data.allocatedQty,
    data.allocatedDate || new Date().toISOString().split('T')[0],
    data.approvedBy || ''
  );
  return { success: true, id: result.lastInsertRowid };
}

// ─── SEED AMIS DATA ──────────────────────────────────────────
function seedAmisData() {
  const defaultUsers = [
    { name: 'System Admin', email: 'admin@ams.local', phone: '0923000001', password: '12345@Aams', role: 'Admin', position: 'ሲስተም አድሚን', locationCode: 'AK-01', departmentCode: 'ADM' },
    { name: 'ተመስገን መርሻ', email: 'temesgen@ams.local', phone: '0923000003', password: '12345@Aams', role: 'Admin', position: 'የንብረት ግምጃ ቤት ኃላፊ', locationCode: 'AK-01', departmentCode: 'STORE' },
    { name: 'አንተነህ መኮንን', email: 'anteneh@ams.local', phone: '0923000004', password: '12345@Aams', role: 'Auditor', position: 'ርዕሰ መምህር', locationCode: 'AK-01', departmentCode: 'ADMIN' },
    { name: 'ዮሐንስ ጌታቸው', email: 'yohannes@ams.local', phone: '0923000005', password: '12345@Aams', role: 'Guest', position: 'የአይሲቲ መምህር', locationCode: 'AK-01', departmentCode: 'LT' },
    { name: 'አለሙ በቀለ', email: 'alemu@ams.local', phone: '0923000006', password: '12345@Aams', role: 'Guest', position: 'መምህር', locationCode: 'AK-01', departmentCode: 'LT' }
  ];

  for (const u of defaultUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR lower(email) = ? OR lower(name) = ?')
      .get(u.phone, u.email.toLowerCase(), u.name.toLowerCase());
    if (!existing) {
      registerUser({
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: u.password,
        role: u.role,
        position: u.position,
        locationCode: u.locationCode,
        departmentCode: u.departmentCode,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0f172a&color=fff`,
        forcePasswordChange: 1
      });
    } else {
      db.prepare('UPDATE users SET phone = ?, position = ?, locationCode = ?, departmentCode = ? WHERE id = ?')
        .run(u.phone, u.position, u.locationCode, u.departmentCode, existing.id);
    }
  }

  const yohannes = db.prepare('SELECT id, name, phone, position, departmentCode FROM users WHERE phone = ?').get('0923000005');
  const alemu = db.prepare('SELECT id, name, phone, position, departmentCode FROM users WHERE phone = ?').get('0923000006');
  const anteneh = db.prepare('SELECT id, name, phone FROM users WHERE phone = ?').get('0923000004');
  const temesgen = db.prepare('SELECT id, name, phone FROM users WHERE phone = ?').get('0923000003');

  if (yohannes && anteneh && temesgen) {
    const h1 = db.prepare('SELECT id FROM user_hierarchies WHERE userId = ?').get(yohannes.id);
    if (!h1) {
      db.prepare(`
        INSERT INTO user_hierarchies (userId, userName, userPhone, position, departmentCode, supervisorId, supervisorName, supervisorPhone, storeKeeperId, storeKeeperName, storeKeeperPhone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        yohannes.id, yohannes.name, yohannes.phone, yohannes.position, yohannes.departmentCode,
        anteneh.id, anteneh.name, anteneh.phone,
        temesgen.id, temesgen.name, temesgen.phone
      );
    }
  }

  if (alemu && anteneh && temesgen) {
    const h2 = db.prepare('SELECT id FROM user_hierarchies WHERE userId = ?').get(alemu.id);
    if (!h2) {
      db.prepare(`
        INSERT INTO user_hierarchies (userId, userName, userPhone, position, departmentCode, supervisorId, supervisorName, supervisorPhone, storeKeeperId, storeKeeperName, storeKeeperPhone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alemu.id, alemu.name, alemu.phone, alemu.position, alemu.departmentCode,
        anteneh.id, anteneh.name, anteneh.phone,
        temesgen.id, temesgen.name, temesgen.phone
      );
    }
  }
}
