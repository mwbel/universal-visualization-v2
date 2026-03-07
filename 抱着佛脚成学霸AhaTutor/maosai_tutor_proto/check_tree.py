import json
import re
from pathlib import Path

def strip_jsonc_comments(text: str) -> str:
    def replacer(match):
        s = match.group(0)
        if s.startswith('/'): return ""
        else: return s
    pattern = re.compile(r'//.*?$|/\*.*?\*/|"(?:\\.|[^\\"])*"', re.DOTALL | re.MULTILINE)
    return re.sub(pattern, replacer, text)

def build_tree():
    catalog_path = Path('aha_knowledge_catalog.jsonc')
    raw_content = catalog_path.read_text(encoding='utf-8', errors='replace')
    text = strip_jsonc_comments(raw_content)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    data = json.loads(text, strict=False)
    knowledge_nodes = data.get("knowledge_nodes", [])
    
    tree = {}
    for node in knowledge_nodes:
        subject = node.get("subject", "其他")
        chapter = node.get("chapter", "未分类")
        section = node.get("section", "一般")
        
        if subject not in tree: tree[subject] = {}
        if chapter not in tree[subject]: tree[subject][chapter] = {}
        if section not in tree[subject][chapter]: tree[subject][chapter][section] = []
        
        tree[subject][chapter][section].append(node["id"])
    
    for subject in tree:
        print(f"Subject: {subject}")
        for chapter in tree[subject]:
            print(f"  Chapter: {chapter}")
            # for section in tree[subject][chapter]:
            #     print(f"    Section: {section}")

build_tree()
