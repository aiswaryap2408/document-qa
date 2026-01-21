import requests
import sys

def verify_cors(url, origin):
    print(f"Testing CORS for storage: {url} from origin: {origin}")
    try:
        headers = {
            'Origin': origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type',
        }
        response = requests.options(url, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        allow_origin = response.headers.get('Access-Control-Allow-Origin')
        print(f"Access-Control-Allow-Origin: {allow_origin}")
        
        if allow_origin == origin or allow_origin == '*':
            print("✅ CORS is working correctly for this origin!")
        else:
            print("❌ CORS failed for this origin.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    base_url = "http://localhost:8088"
    test_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://other-domain.com"
    ]
    
    for origin in test_origins:
        verify_cors(f"{base_url}/auth/send-otp", origin)
        print("-" * 20)
