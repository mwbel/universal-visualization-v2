import json
import re

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

def check_catalog():
    with open('aha_knowledge_catalog.jsonc', 'r', encoding='utf-8') as f:
        content = f.read()
    content = strip_jsonc_comments(content)
    content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', content)
    data = json.loads(content)
    
    nodes = data.get('knowledge_nodes', [])
    for node in nodes:
        chapter = node.get('chapter', '')
        if chapter in ['数列', '向量']:
            viz = node.get('viz', {})
            viz_id = viz.get('viz_id')
            if not viz_id:
                print(f"Node {node['id']} ({node['title']}) is missing viz_id")
            elif viz_id not in ['sequence_lab', 'vector_lab', 'info_card']:
                 print(f"Node {node['id']} has unexpected viz_id: {viz_id}")

check_catalog()
