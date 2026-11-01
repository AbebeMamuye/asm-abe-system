import urllib.request
import json
import time

BASE_URL = "http://localhost:5002/api"

def test_pending_flow():
    time.sleep(1)
    print("Testing GET /api/pending...")
    req = urllib.request.Request(f"{BASE_URL}/pending")
    with urllib.request.urlopen(req) as resp:
        initial = json.loads(resp.read().decode('utf-8'))
        print(f"Initial pending requests count: {len(initial)}")

    print("\nTesting POST /api/pending (Consumable Requisition)...")
    payload = {
        "type": "Requisition",
        "requestedBy": "ዮሐንስ ጌታቸው",
        "department": "WRD-01",
        "description": "Consumable Requisition: 5x A4 Double-A Copy Paper (ወረቀት በካርቶን) for ለቢሮ ስራ",
        "payload": {
            "item": "A4 Double-A Copy Paper (ወረቀት በካርቶን)",
            "quantity": 5,
            "purpose": "ለቢሮ ስራ"
        }
    }
    data = json.dumps(payload).encode('utf-8')
    post_req = urllib.request.Request(f"{BASE_URL}/pending", data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(post_req) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        print("Create response:", result)
        assert result.get("success") == True, "Failed to create pending request"
        req_id = result.get("id")

    print(f"\nVerifying pending request {req_id} is in DB...")
    req = urllib.request.Request(f"{BASE_URL}/pending?status=Pending")
    with urllib.request.urlopen(req) as resp:
        pending_list = json.loads(resp.read().decode('utf-8'))
        found = any(r.get("id") == req_id for r in pending_list)
        print(f"Found request in Pending list: {found}")
        assert found, "Created request not found in pending list"

    print(f"\nTesting review request {req_id} (Approval)...")
    review_payload = {
        "action": "Approved",
        "reviewedBy": "System Admin",
        "reviewNote": "Approved for office printing needs."
    }
    review_data = json.dumps(review_payload).encode('utf-8')
    put_req = urllib.request.Request(f"{BASE_URL}/pending/{req_id}/review", data=review_data, headers={"Content-Type": "application/json"}, method="PUT")
    with urllib.request.urlopen(put_req) as resp:
        review_result = json.loads(resp.read().decode('utf-8'))
        print("Review response:", review_result)
        assert review_result.get("success") == True, "Failed to approve pending request"

    print("\nALL PENDING REQUEST TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_pending_flow()
