import requests

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

url = "http://localhost:8001/auth/me"

for origin in origins:
    print(f"Testing Origin: {origin}")
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = requests.options(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"CORS Headers: { {k: v for k, v in response.headers.items() if 'access-control' in k.lower()} }")
    print("-" * 20)
