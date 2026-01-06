import requests
try:
    r = requests.get("https://www.google.com", timeout=5)
    print(f"Internet check: Google status {r.status_code}")
except Exception as e:
    print(f"Internet check failed: {e}")

url = "https://api.ccrdev.clickastro.com/chat/api.php"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}
try:
    r = requests.get(url, headers=headers, timeout=5)
    print(f"ClickAstro GET test: Status {r.status_code}")
    print(f"Response: {r.text[:200]}")
except Exception as e:
    print(f"ClickAstro GET test failed: {e}")
