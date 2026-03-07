import re

file_path = 'aha_knowledge_catalog.jsonc'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove existing viz_args
content = re.sub(r'\s*"viz_args":\s*\{\s*"module":\s*"[^"]+"\s*\},?', '', content)
content = re.sub(r'\s*"viz_args":\s*\{\s*\n\s*"module":\s*"[^"]+"\s*\n\s*\},?', '', content)

# 2. Insert fresh viz_args
# Sequence Lab
pattern_seq = r'("viz_id":\s*"sequence_lab",)'
replacement_seq = r'\1\n        "viz_args": { "module": "def" },'
content, count_seq = re.subn(pattern_seq, replacement_seq, content)
print(f"Replaced {count_seq} sequence_lab")

# Vector Lab
pattern_vec = r'("viz_id":\s*"vector_lab",)'
replacement_vec = r'\1\n        "viz_args": { "module": "concept" },'
content, count_vec = re.subn(pattern_vec, replacement_vec, content)
print(f"Replaced {count_vec} vector_lab")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
