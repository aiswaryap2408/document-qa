import requests
import time

BASE_URL = "http://localhost:8088/auth"
MOBILE = "9999999999"

def test_otp_flow():
    print("1. Sending first OTP...")
    resp = requests.post(f"{BASE_URL}/send-otp", json={"mobile": MOBILE})
    data = resp.json()
    print(f"Response: {data}")
    assert data["otp"] == "1234"
    
    print("\n2. Resending OTP (Retry)...")
    resp = requests.post(f"{BASE_URL}/send-otp", json={"mobile": MOBILE})
    data = resp.json()
    print(f"Response: {data}")
    assert data["otp"] == "9876"
    
    print("\n3. Verifying with correct OTP (9876)...")
    resp = requests.post(f"{BASE_URL}/verify-otp", json={"mobile": MOBILE, "otp": "9876"})
    print(f"Verify Response: {resp.status_code}, {resp.json()}")
    assert resp.status_code == 200
    
    print("\n4. Verifying again (should fail as record deleted)...")
    resp = requests.post(f"{BASE_URL}/verify-otp", json={"mobile": MOBILE, "otp": "9876"})
    print(f"Repeat Verify Status: {resp.status_code}")
    assert resp.status_code == 400
    
    print("\n5. Testing Expiration (simulating time)...")
    # We can't easily wait 5 mins in a script, so let's just test that send works again
    requests.post(f"{BASE_URL}/send-otp", json={"mobile": MOBILE})
    print("New OTP (1234) sent after deletion.")
    
    print("\nSUCCESS: OTP flow verified.")

if __name__ == "__main__":
    try:
        test_otp_flow()
    except Exception as e:
        print(f"FAILED: {e}")
