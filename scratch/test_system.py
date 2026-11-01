import urllib.request
import json

BASE = "http://localhost:5002/api"

endpoints = [
    ("/assets", "GET"),
    ("/transactions", "GET"),
    ("/stats", "GET"),
    ("/vouchers/m19", "GET"),
    ("/vouchers/m20", "GET"),
    ("/vouchers/m22", "GET"),
    ("/maintenance", "GET"),
    ("/inventory-counts", "GET"),
    ("/disposals", "GET"),
    ("/users", "GET"),
    ("/hierarchies", "GET"),
    ("/transfers", "GET"),
    ("/allocations", "GET"),
    ("/asset-history", "GET"),
]

print("=== TESTING BACKEND API ENDPOINTS ===")
all_passed = True
for ep, method in endpoints:
    url = f"{BASE}{ep}"
    try:
        req = urllib.request.Request(url, method=method)
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
            status = res.status
            count = len(data) if isinstance(data, list) else (len(data.keys()) if isinstance(data, dict) else 1)
            print(f"✅ {method} {ep:<20} HTTP {status} | Count/Keys: {count}")
    except Exception as e:
        print(f"❌ {method} {ep:<20} FAILED: {e}")
        all_passed = False

print("\nResult:", "ALL ENDPOINTS HEALTHY" if all_passed else "SOME ENDPOINTS FAILED")
