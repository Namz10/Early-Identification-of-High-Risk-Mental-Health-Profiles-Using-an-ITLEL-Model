import urllib.request
import json
req = urllib.request.Request(
    'http://localhost:8000/api/predict',
    data=json.dumps({"answers":[3,3,3,3,3,3,3,3,3]}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
print(res.read().decode())
