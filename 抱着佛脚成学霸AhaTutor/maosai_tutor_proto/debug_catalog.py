import re

file_path = 'aha_knowledge_catalog.jsonc'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find index of first sequence_lab
idx = content.find('"viz_id": "sequence_lab"')
if idx != -1:
    print("Found sequence_lab at index", idx)
    print("Context:")
    print(repr(content[idx:idx+100]))
else:
    print("Not found")

# Try to match again
pattern = r'("viz_id":\s*"sequence_lab",\s*)("viz_desc")'
match = re.search(pattern, content)
if match:
    print("Match found!")
else:
    print("No match found")
