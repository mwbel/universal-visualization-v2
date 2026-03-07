import re

file_path = 'aha_knowledge_catalog.jsonc'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: viz_id followed by whitespace (including newline) then viz_desc
pattern = r'("viz_id":\s*"sequence_lab",\s*)("viz_desc")'
replacement = r'\1"viz_args": { "module": "def" },\n        \2'

new_content, count = re.subn(pattern, replacement, content)

print(f"Replaced {count} occurrences")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
