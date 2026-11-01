import sqlite3

conn = sqlite3.connect('data/asset-management.db')
c = conn.cursor()
c.execute("DELETE FROM pending_requests WHERE requestedBy = 'ዮሐንስ ጌታቸው'")
conn.commit()
print(f"Cleaned up {c.rowcount} test requests.")
conn.close()
