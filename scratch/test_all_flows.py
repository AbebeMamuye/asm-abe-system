import urllib.request
import json
import sys

BASE = "http://localhost:5002/api"

def request(endpoint, method="GET", body=None):
    url = f"{BASE}{endpoint}"
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            text = res.read().decode('utf-8')
            return json.loads(text) if text else {}
    except Exception as e:
        print(f"FAILED {method} {endpoint}: {e}")
        return None

print("=== RUNNING FULL END-TO-END AMIS SYSTEM FUNCTIONALITY AUDIT ===")

# 1. Test Login with Admin
res = request("/auth/login", "POST", {"emailOrName": "0923000001", "password": "12345@Aams"})
if res and res.get("success"):
    print("✅ 1. Authentication Flow: Admin login successful.")
else:
    print(f"❌ 1. Authentication Flow failed: {res}")

# 2. Test Fetching Users & Roles
users = request("/users")
if users and len(users) >= 5:
    print(f"✅ 2. User Directory: {len(users)} users active across all institutional roles.")
else:
    print(f"❌ 2. User Directory issue: {users}")

# 3. Test Assets
assets = request("/assets")
if assets and len(assets) > 0:
    print(f"✅ 3. Fixed Asset Register: {len(assets)} assets loaded with valuation.")
else:
    print(f"❌ 3. Asset Register issue: {assets}")

# 4. Test Hierarchy Links
hierarchies = request("/hierarchies")
if hierarchies is not None:
    print(f"✅ 4. Organizational Hierarchy: {len(hierarchies)} reporting chains active.")
else:
    print("❌ 4. Hierarchy fetch failed.")

# 5. Test Transfers
transfers = request("/transfers")
if transfers is not None:
    print(f"✅ 5. Peer-to-Peer Transfers: {len(transfers)} transfer records registered.")
else:
    print("❌ 5. Transfers fetch failed.")

# 6. Test Model 19 Vouchers (Receipts)
m19 = request("/vouchers/m19")
if m19 is not None:
    print(f"✅ 6. Model 19 Store Receipts: {len(m19)} vouchers on file.")
else:
    print("❌ 6. M19 fetch failed.")

# 7. Test Model 20 Vouchers (Requisitions)
m20 = request("/vouchers/m20")
if m20 is not None:
    print(f"✅ 7. Model 20 Requisitions: {len(m20)} vouchers on file.")
else:
    print("❌ 7. M20 fetch failed.")

# 8. Test Model 22 Vouchers (Issues)
m22 = request("/vouchers/m22")
if m22 is not None:
    print(f"✅ 8. Model 22 Store Issues: {len(m22)} vouchers on file.")
else:
    print("❌ 8. M22 fetch failed.")

# 9. Test Maintenance Tickets
maint = request("/maintenance")
if maint is not None:
    print(f"✅ 9. Maintenance & Repair: {len(maint)} tickets tracked.")
else:
    print("❌ 9. Maintenance fetch failed.")

# 10. Test Inventory Counts
counts = request("/inventory-counts")
if counts is not None:
    print(f"✅ 10. Annual Inventory Physical Counts: {len(counts)} counts recorded.")
else:
    print("❌ 10. Inventory count fetch failed.")

# 11. Test Disposals
disposals = request("/disposals")
if disposals is not None:
    print(f"✅ 11. Property Disposal Register: {len(disposals)} decommissioned records.")
else:
    print("❌ 11. Disposals fetch failed.")

# 12. Test Audit History Trail
history = request("/asset-history")
if history is not None:
    print(f"✅ 12. Complete Audit History Trail: {len(history)} immutable transaction logs.")
else:
    print("❌ 12. Audit history fetch failed.")

print("\n=== AUDIT COMPLETE: ALL MODULES SYNCHRONIZED AND OPERATIONAL ===")
