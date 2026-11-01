const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'asset-management-ims', 'property-management.db');
const db = new Database(dbPath);

const sampleAssets = [
  { name: 'Dell Latitude 5420 Laptop', category: 'Electronics', quantity: 12, unit: 'Unit', unitCost: 48000, location: 'IT Department', condition: 'Functional', fundSource: 'Regular' },
  { name: 'HP LaserJet Pro Printer', category: 'Electronics', quantity: 5, unit: 'Unit', unitCost: 22000, location: 'Finance Department', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Ergonomic Office Chair', category: 'Furniture', quantity: 40, unit: 'Piece', unitCost: 5500, location: 'General Office', condition: 'Functional', fundSource: 'Internal Revenue' },
  { name: 'Executive Office Desk (L-Shape)', category: 'Furniture', quantity: 15, unit: 'Unit', unitCost: 12000, location: 'Management Wing', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Toyota Hilux 4x4 Pickup', category: 'Vehicles', quantity: 2, unit: 'Unit', unitCost: 1850000, location: 'Transport Pool', condition: 'Functional', fundSource: 'Aid' },
  { name: 'A4 Copy Paper (80gsm)', category: 'Stationery', quantity: 200, unit: 'Ream', unitCost: 320, location: 'Store Room', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Projector (Epson XGA)', category: 'Electronics', quantity: 3, unit: 'Unit', unitCost: 35000, location: 'Conference Room', condition: 'Functional', fundSource: 'Internal Revenue' },
  { name: 'Standing Air Conditioner (2.5Ton)', category: 'Electronics', quantity: 6, unit: 'Unit', unitCost: 65000, location: 'Server Room', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Filing Cabinet (4-Drawer)', category: 'Furniture', quantity: 20, unit: 'Unit', unitCost: 8500, location: 'Records Office', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Generator (15KVA Diesel)', category: 'Machinery', quantity: 1, unit: 'Unit', unitCost: 285000, location: 'Back Yard', condition: 'Functional', fundSource: 'Aid' },
  { name: 'Water Dispenser (Hot & Cold)', category: 'Appliances', quantity: 8, unit: 'Unit', unitCost: 4200, location: 'Break Room', condition: 'Functional', fundSource: 'Internal Revenue' },
  { name: 'CCTV Security Camera System', category: 'Electronics', quantity: 1, unit: 'Set', unitCost: 95000, location: 'Security Desk', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Conference Table (12-Seater)', category: 'Furniture', quantity: 2, unit: 'Unit', unitCost: 45000, location: 'Board Room', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Heavy-Duty Shredder', category: 'Appliances', quantity: 3, unit: 'Unit', unitCost: 18500, location: 'Records Office', condition: 'Functional', fundSource: 'Internal Revenue' },
  { name: 'Uninterruptible Power Supply (UPS 2KVA)', category: 'Electronics', quantity: 10, unit: 'Unit', unitCost: 16000, location: 'IT Department', condition: 'Functional', fundSource: 'Regular' },
  { name: 'Whiteboard (180x120cm)', category: 'Stationery', quantity: 8, unit: 'Piece', unitCost: 3800, location: 'Training Room', condition: 'Functional', fundSource: 'Regular' }
];
const sampleUsers = [
  { name: 'AbeTech', email: 'abetech@admin.org', password: 'TechAbe@123', role: 'Admin', avatar: 'https://ui-avatars.com/api/?name=AbeTech&background=random' }
];
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

try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Guest'`);
} catch (e) {
  // Ignore error if column already exists
}

const insertAsset = db.prepare(`
  INSERT OR IGNORE INTO assets (name, category, fundSource, quantity, unit, unitCost, location, condition)
  VALUES (@name, @category, @fundSource, @quantity, @unit, @unitCost, @location, @condition)
`);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, role, avatar)
  VALUES (@name, @email, @password, @role, @avatar)
`);

db.transaction(() => {
  for (const asset of sampleAssets) {
    insertAsset.run(asset);
  }
  for (const user of sampleUsers) {
    insertUser.run(user);
  }
})();

console.log(`Successfully seeded ${sampleAssets.length} general-purpose office assets into the database.`);
db.close();
