const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath1 = path.join(os.homedir(), 'AppData', 'Roaming', 'inventory-ims', 'property-management.db');
const dbPath2 = path.join(os.homedir(), 'AppData', 'Roaming', 'Asset Management System', 'property-management.db');

function testDb(dbPath) {
  console.log('Testing DB at:', dbPath);
  try {
    const db = new Database(dbPath, { fileMustExist: true });
    
    // Check if table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name).join(', '));
    
    // Run the failing query
    const vs = db.prepare('SELECT * FROM vouchers_model22 ORDER BY createdAt DESC').all();
    console.log('Vouchers M22 count:', vs.length);
    
    db.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDb(dbPath1);
console.log('---');
testDb(dbPath2);
