import sqlite3
import os

app_data = os.path.join(os.environ.get('APPDATA'), 'inventory-ims', 'property-management.db')
new_app_data = os.path.join(os.environ.get('APPDATA'), 'Asset Management System', 'property-management.db')

def check_db(db_path):
    print(f"Testing {db_path}")
    if not os.path.exists(db_path):
        print("  Not found.")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cur.fetchall()]
        print("  Tables:", ", ".join(tables))
        
        if 'vouchers_model22' in tables:
            cur.execute("PRAGMA table_info(vouchers_model22);")
            cols = [r[1] for r in cur.fetchall()]
            print("  vouchers_model22 columns:", ", ".join(cols))
            
            try:
                cur.execute("SELECT * FROM vouchers_model22 ORDER BY createdAt DESC")
                rows = cur.fetchall()
                print(f"  vouchers_model22 count: {len(rows)}")
            except Exception as e:
                print(f"  Error on SELECT vouchers_model22: {e}")
                
        if 'voucher_items' in tables:
            cur.execute("PRAGMA table_info(voucher_items);")
            cols = [r[1] for r in cur.fetchall()]
            print("  voucher_items columns:", ", ".join(cols))
            
            try:
                cur.execute("SELECT * FROM voucher_items")
                rows = cur.fetchall()
                print(f"  voucher_items count: {len(rows)}")
            except Exception as e:
                print(f"  Error on SELECT voucher_items: {e}")
                
        if 'assets' in tables:
            cur.execute("PRAGMA table_info(assets);")
            cols = [r[1] for r in cur.fetchall()]
            print("  assets columns:", ", ".join(cols))
            
    except Exception as e:
        print(f"  Error opening DB: {e}")

check_db(app_data)
check_db(new_app_data)
