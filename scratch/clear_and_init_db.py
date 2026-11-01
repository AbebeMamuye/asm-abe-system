import sqlite3

db_path = './data/asset-management.db'
con = sqlite3.connect(db_path)
cur = con.cursor()

# 1. Clear sample tables
tables_to_clear = [
    'asset_history',
    'inventory_count_items',
    'inventory_counts',
    'disposals',
    'voucher_items',
    'vouchers_model19',
    'vouchers_model20',
    'vouchers_model22',
    'transactions',
    'maintenance_logs',
    'pending_requests',
    'asset_transfers',
    'consumable_allocations',
    'user_hierarchies',
    'assets'
]

for t in tables_to_clear:
    cur.execute(f"DELETE FROM {t};")
    print(f"Cleared table: {t}")

# 2. Keep only System Admin user (clean state)
cur.execute("DELETE FROM users WHERE phone != '0923000001' AND lower(email) != 'admin@ams.local';")
print("Cleaned users (kept System Admin)")

# 3. Create and seed departments table if needed
cur.execute("""
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amharicName TEXT,
  type TEXT DEFAULT 'Sector',
  description TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);
""")

default_depts = [
    ('WRD-01', 'Woreda 01 Administration', 'ወረዳ 01 አስተዳደር ጽ/ቤት', 'Woreda', 'Woreda 01 Public Administration'),
    ('WRD-02', 'Woreda 02 Administration', 'ወረዳ 02 አስተዳደር ጽ/ቤት', 'Woreda', 'Woreda 02 Public Administration'),
    ('WRD-03', 'Woreda 03 Administration', 'ወረዳ 03 አስተዳደር ጽ/ቤት', 'Woreda', 'Woreda 03 Public Administration'),
    ('WRD-04', 'Woreda 04 Administration', 'ወረዳ 04 አስተዳደር ጽ/ቤት', 'Woreda', 'Woreda 04 Public Administration'),
    ('WRD-05', 'Woreda 05 Administration', 'ወረዳ 05 አስተዳደር ጽ/ቤት', 'Woreda', 'Woreda 05 Public Administration'),
    ('STORE', 'Logistics & Central Store', 'ዋና ንብረትና ግምጃ ቤት', 'Store', 'Central Property Storage & Inventory Hub'),
    ('FIN', 'Finance & Economic Development', 'ፋይናንስና ኢኮኖሚ ልማት ጽ/ቤት', 'Sector', 'Budget, Accounting & Procurement'),
    ('EDU', 'Education Bureau / Office', 'ትምህርት ጽ/ቤት', 'Sector', 'Schools, Teaching Materials & Academic Facilities'),
    ('HEALTH', 'Health Bureau / Center', 'ጤና ጽ/ቤት', 'Sector', 'Health Centers, Clinics & Medical Property'),
    ('IT', 'Information Technology (IT)', 'ኢንፎርሜሽን ኮሙኒኬሽን ቴክኖሎጂ', 'Division', 'ICT Infrastructure, Hardware & Systems'),
    ('HR', 'Human Resources & Administration', 'የሰው ኃይልና ጠቅላላ አገልግሎት', 'Division', 'Personnel, General Services & Facilities'),
    ('AUD', 'Internal Audit & Inspection', 'ውስጥ ኦዲትና ቁጥጥር', 'Division', 'Compliance, Audit Trails & Verification')
]

for d in default_depts:
    cur.execute("""
        INSERT OR IGNORE INTO departments (code, name, amharicName, type, description, isActive)
        VALUES (?, ?, ?, ?, ?, 1)
    """, d)

# 4. Reset autoincrement sequence
try:
    cur.execute("""
        DELETE FROM sqlite_sequence WHERE name IN (
            'assets', 'vouchers_model19', 'vouchers_model20', 'vouchers_model22',
            'voucher_items', 'transactions', 'asset_transfers', 'consumable_allocations',
            'inventory_counts', 'inventory_count_items', 'disposals', 'maintenance_logs',
            'pending_requests', 'asset_history'
        );
    """)
except Exception as e:
    print("Sequence reset:", e)

con.commit()

# 5. Check and print counts
print("\n--- NEW TABLE COUNTS ---")
all_tables = [t[0] for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
for t in all_tables:
    cnt = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"{t}: {cnt}")

print("\n--- REMAINING USERS ---")
for u in cur.execute("SELECT id, name, email, phone, role FROM users").fetchall():
    print(u)

print("\n--- SECTORS / DEPARTMENTS ---")
for dep in cur.execute("SELECT code, name, amharicName, type FROM departments").fetchall():
    print(dep)

con.close()
