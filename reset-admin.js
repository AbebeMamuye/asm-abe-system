const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'asset-management-ims', 'property-management.db');
const db = new Database(dbPath);

try {
  // 1. Ensure table exists
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

  // 2. Clear existing AbeTech or admin to avoid conflicts
  db.prepare("DELETE FROM users WHERE name = 'AbeTech' OR email = 'abetech@admin.org'").run();

  // 3. Insert the fresh credentials
  const stmt = db.prepare(`
    INSERT INTO users (name, email, password, role, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    'AbeTech', 
    'abetech@admin.org', 
    'TechAbe@123', 
    'Admin', 
    'https://ui-avatars.com/api/?name=AbeTech&background=random'
  );

  console.log('--------------------------------------------------');
  console.log('SUCCESS: Admin credentials have been reset!');
  console.log('--------------------------------------------------');
  console.log('Username/Email: abetech@admin.org');
  console.log('Password:       TechAbe@123');
  console.log('Role:           Admin');
  console.log('--------------------------------------------------');

} catch (err) {
  console.error('ERROR resetting password:', err.message);
} finally {
  db.close();
}
