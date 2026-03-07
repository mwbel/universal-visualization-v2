import re

file_path = 'aha_knowledge_catalog.jsonc'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove existing viz_args for sequence_lab and vector_lab
# We look for "viz_args" ... "module": "..." ... } 
# This is a bit risky with regex.
# Let's just remove any line that contains "viz_args" and "module".
# And also lines that are just "viz_args": { or closing } if they are artifacts.

# Better: Remove the exact strings we know are there.
# Single line version
content = re.sub(r'\s*"viz_args":\s*\{\s*"module":\s*"[^"]+"\s*\},?', '', content)

# Multi-line version (if any)
# "viz_args": {\n          "module": "concept"\n        },
content = re.sub(r'\s*"viz_args":\s*\{\s*\n\s*"module":\s*"[^"]+"\s*\n\s*\},?', '', content)

# 2. Insert fresh viz_args
# Sequence Lab -> def
# Vector Lab -> concept

# Sequence Lab
# Find "viz_id": "sequence_lab",
# Insert "viz_args": { "module": "def" }, after it.
# We use a pattern that ensures we don't insert if it's already there (though we just deleted it).
pattern_seq = r'("viz_id":\s*"sequence_lab",)'
replacement_seq = r'\1\n        "viz_args": { "module": "def" },'
content = re.sub(pattern_seq, replacement_seq, content)

# Vector Lab
# Find "viz_id": "vector_lab",
pattern_vec = r'("viz_id":\s*"vector_lab",)'
replacement_vec = r'\1\n        "viz_args": { "module": "concept" },'
content = re.sub(pattern_vec, replacement_vec, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned and updated catalog.")
