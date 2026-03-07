import json
import re
from pathlib import Path

def strip_jsonc_comments(text: str) -> str:
    def replacer(match):
        s = match.group(0)
        if s.startswith('/'):
            return ""
        else:
            return s
    pattern = re.compile(
        r'//.*?$|/\*.*?\*/|"(?:\\.|[^\\"])*"',
        re.DOTALL | re.MULTILINE
    )
    return re.sub(pattern, replacer, text)

path = Path("/Users/jance/Downloads/maosai_tutor_proto/aha_knowledge_catalog.jsonc")
content = path.read_text(encoding='utf-8', errors='replace')
stripped = strip_jsonc_comments(content)
# Add cleaning logic
cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', stripped)

# The error was at line 1378, column 8 (char 37532)
# Re-calculate char position in cleaned if possible, or just look at repr
start = max(0, 37532 - 100)
end = min(len(cleaned), 37532 + 100)

print(f"--- Cleaned area (approx chars {start} to {end}) ---")
print(repr(cleaned[start:end]))
print("--- End ---")

try:
    json.loads(cleaned, strict=False)
    print("JSON parsed successfully with cleaning and strict=False!")
except Exception as e:
    print(f"JSON parse failed after cleaning: {e}")
