import urllib.request
import json

BASE = "http://localhost:5002/api"

# 1. Register a test staff member with default password and forcePasswordChange: 1
user_payload = {
    "name": "የሙከራ ሰራተኛ (Test Staff)",
    "email": "teststaff@ams.local",
    "phone": "0911998877",
    "position": "Junior Inspector",
    "department": "የጤና ጥበቃ ጽ/ቤት (Health Office)",
    "departmentCode": "HT",
    "role": "Staff",
    "password": "12345@Aams",
    "forcePasswordChange": 1
}

req = urllib.request.Request(f"{BASE}/users/register", data=json.dumps(user_payload).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as res:
        res_data = json.loads(res.read().decode())
        print("Registration result:", res_data)
        user_id = res_data.get("id")
except Exception as e:
    print("Registration error:", e)
    user_id = None

# 2. Login as the newly created user
login_req = urllib.request.Request(f"{BASE}/auth/login", data=json.dumps({"emailOrName": "0911998877", "password": "12345@Aams"}).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(login_req) as res:
        login_data = json.loads(res.read().decode())
        print("Login result:", login_data)
        user = login_data.get("user", {})
        print(f"User: {user.get('name')}, ForcePasswordChange: {user.get('forcePasswordChange')}")
except Exception as e:
    print("Login error:", e)

# 3. Test Changing Password
if user_id:
    change_req = urllib.request.Request(f"{BASE}/auth/change-password", data=json.dumps({"userId": user_id, "newPassword": "MySecretPass@2026"}).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(change_req) as res:
            change_data = json.loads(res.read().decode())
            print("Password change result:", change_data)
    except Exception as e:
        print("Password change error:", e)

    # 4. Verify login with NEW password
    login_new_req = urllib.request.Request(f"{BASE}/auth/login", data=json.dumps({"emailOrName": "0911998877", "password": "MySecretPass@2026"}).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(login_new_req) as res:
            login_new_data = json.loads(res.read().decode())
            print("Login with new permanent password:", login_new_data.get("success"), "ForcePasswordChange:", login_new_data.get("user", {}).get("forcePasswordChange"))
    except Exception as e:
        print("Login with new password error:", e)
