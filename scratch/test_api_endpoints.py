import urllib.request
import json

base_url = 'http://localhost:5002/api'

def get(path):
    req = urllib.request.Request(f"{base_url}{path}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post(path, data):
    req = urllib.request.Request(
        f"{base_url}{path}",
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def delete(path):
    req = urllib.request.Request(f"{base_url}{path}", method='DELETE')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("1. Checking assets...")
assets = get('/assets')
print(f"Asset count: {len(assets)}")
assert len(assets) == 0, f"Expected 0 assets, got {len(assets)}"

print("2. Checking vouchers...")
m19 = get('/vouchers/m19')
print(f"M19 voucher count: {len(m19)}")
assert len(m19) == 0, f"Expected 0 vouchers, got {len(m19)}"

print("3. Checking departments...")
depts = get('/departments')
print(f"Initial departments count: {len(depts)}")
for d in depts[:5]:
    print(f"  - [{d['code']}] {d['name']} ({d.get('amharicName')})")

print("\n4. Testing adding 6th Sector (Woreda 06)...")
res_add = post('/departments', {
    'code': 'WRD-06',
    'name': 'Woreda 06 Administration',
    'amharicName': 'ወረዳ 06 አስተዳደር ጽ/ቤት',
    'type': 'Woreda',
    'description': '6th Sector Woreda office added dynamically'
})
print(f"Add response: {res_add}")
assert res_add.get('success') == True, "Failed to add Woreda 06"

print("5. Verifying Woreda 06 is present...")
depts_after = get('/departments')
print(f"Updated departments count: {len(depts_after)}")
w6 = [d for d in depts_after if d['code'] == 'WRD-06']
assert len(w6) == 1, "WRD-06 not found in departments"
print(f"Found Woreda 06: {w6[0]}")

print("\n6. Testing asset registration under Woreda 06...")
asset_res = post('/assets', {
    'name': 'Lenovo ThinkPad P16 Workstation',
    'category': 'Electronics',
    'fundSource': 'Budget',
    'quantity': 1,
    'unitCost': 120000,
    'unit': 'Piece',
    'location': 'ወረዳ 06 ዋና ጽ/ቤት',
    'condition': 'Functional',
    'tagNumber': 'ETH-WRD06-001',
    'department': 'ወረዳ 06 አስተዳደር ጽ/ቤት'
})
print(f"Asset create response: {asset_res}")
created_id = asset_res.get('id')

assets_w6 = get('/assets')
print(f"Assets in DB: {len(assets_w6)}")
assert len(assets_w6) == 1
assert assets_w6[0]['department'] == 'ወረዳ 06 አስተዳደር ጽ/ቤት'
print(f"Asset assigned to: {assets_w6[0]['department']}")

print("\n7. Cleaning up test asset...")
del_res = delete(f"/assets/{created_id}")
print(f"Delete asset response: {del_res}")

assets_clean = get('/assets')
print(f"Assets after cleanup: {len(assets_clean)}")
assert len(assets_clean) == 0

print("\nALL TESTS PASSED SUCCESSFULLY! 🚀")
