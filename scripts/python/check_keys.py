import urllib.request
import json
import ssl
import time
import sys

# Ignore SSL verification errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# List of keys extracted from your message
keys = [
    "AIzaSyAU3B5coLYWQnlCjOwZg0JQQj7K5sw8q80",
    "AIzaSyA6_9MBfmKHGbH7OI0GV5FiV0N8Mh8o1GY",
    "AIzaSyA2oPOk-nJMJDlc0jVvOTN1fhzW45pzt9w",
    "AIzaSyBxCbCpjnEGyIeAIV2eBjeyCGhGerPC1Ro",
    "AIzaSyD5AegzQTwS8A2o_jbyw3m5yGxvIlRGjj8",
    "AIzaSyDe3zpjNwyMyXPIdnCcLYJ8HrgWc_sdu-I",
    "AIzaSyB3blgFw-aq2QJrE2RzBjR-msa9SmhP_TM",
    "AIzaSyABd-tykN_UhDqygrCKW5ReyMXM2k6SjOg",
    "AIzaSyAROtWYKYVIUTQ--KCM-zQCofLWYTNttZU",
    "AIzaSyDKYPcocYVQp_0SUeG0BKH7E4AwKMeWTKI",
    "AIzaSyDQumq0V2TqAdTTXj9TSy0uHtiwgrfRDY4",
    "AIzaSyBlqJyj878Hp7z9POhG2wIGKMw9KMMyaZc",
    "AIzaSyCZISN0EG9glYADK0_y5Flyr3kRjDKLKbw",
    "AIzaSyA_4uZD0uR1VxpyyM8QP7OFdhxnMkzCoAI",
    "AIzaSyBIKSIfQpyey3VARICCFmBZoYgqseh0jzo",
    "AIzaSyBC0CKcEAjRAEiAXSOlJNOufzdTaKw_RXk",
    "AIzaSyCK7n8soqlCL0V9-G94_7jpY_BD86GoWcg"
]

unique_keys = list(set(keys))
print(f"🔍 开始检测 {len(unique_keys)} 个去重后的 Gemini API Key...\n")
print(f"{'API Key':<45} | {'状态':<10} | {'响应信息'}")
print("-" * 80)

url_template = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={}"
headers = {'Content-Type': 'application/json'}
data = json.dumps({
    "contents": [{"parts": [{"text": "Hi"}]}]
}).encode('utf-8')

valid_keys = []
invalid_keys = []

for i, key in enumerate(unique_keys):
    url = url_template.format(key)
    status_icon = "❓"
    status_text = "Checking"
    msg = ""
    
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
            if response.status == 200:
                status_icon = "✅"
                status_text = "有效"
                msg = "200 OK"
                valid_keys.append(key)
            else:
                status_icon = "❌"
                status_text = "无效"
                msg = f"Status: {response.status}"
                invalid_keys.append(key)
                
    except urllib.error.HTTPError as e:
        status_icon = "❌"
        status_text = "无效"
        msg = f"HTTP {e.code}: {e.reason}"
        invalid_keys.append(key)
    except Exception as e:
        status_icon = "⚠️"
        status_text = "错误"
        msg = str(e)[:20]
        invalid_keys.append(key)

    print(f"{key:<45} | {status_icon} {status_text:<6} | {msg}")
    time.sleep(0.2) # Avoid rate limits

print("-" * 80)
print(f"\n📊 检测结果汇总:")
print(f"   有效 Key: {len(valid_keys)}")
print(f"   无效 Key: {len(invalid_keys)}")

if valid_keys:
    print("\n✅ 有效 Key 列表 (可直接复制):")
    for k in valid_keys:
        print(k)

with open('valid_keys.txt', 'w') as f:
    for k in valid_keys:
        f.write(k + '\n')

print("\n💾 有效 Key 已保存至 valid_keys.txt")
