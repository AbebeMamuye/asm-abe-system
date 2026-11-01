import sqlite3

con = sqlite3.connect('./data/asset-management.db')
cur = con.cursor()
tables = [t[0] for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
print("--- TABLE COUNTS ---")
for t in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"{t}: {count}")

print("\n--- USERS ---")
for u in cur.execute("SELECT id, name, email, phone, role, position, departmentCode FROM users").fetchall():
    print(u)
con.close()
