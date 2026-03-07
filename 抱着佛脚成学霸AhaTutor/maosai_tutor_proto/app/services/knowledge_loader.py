import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

def strip_jsonc_comments(text: str) -> str:
    """Removes // and /* */ comments from JSONC text, respecting strings."""
    def replacer(match):
        s = match.group(0)
        if s.startswith('/'):
            return "" # It's a comment
        else:
            return s   # It's a string
    
    # Matches strings (including escaped quotes) or comments
    pattern = re.compile(
        r'//.*?$|/\*.*?\*/|"(?:\\.|[^\\"])*"',
        re.DOTALL | re.MULTILINE
    )
    return re.sub(pattern, replacer, text)

class KnowledgeLoader:
    def __init__(self, workspace_root: Path):
        self.workspace_root = workspace_root
        self.catalog_path = workspace_root / "aha_knowledge_catalog.jsonc"
        self.registry_path = workspace_root / "aha_view_registry.jsonc"
        
        self.knowledge_nodes = []
        self.view_registry = []
        self.knowledge_tree = {} # subject -> chapter -> section -> nodes

    def load(self):
        def clean_content(text):
            # Remove comments
            text = strip_jsonc_comments(text)
            # Remove control characters except \t, \n, \r
            text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
            return text

        if self.catalog_path.exists():
            raw_content = self.catalog_path.read_text(encoding='utf-8', errors='replace')
            content = clean_content(raw_content)
            data = json.loads(content, strict=False)
            self.knowledge_nodes = data.get("knowledge_nodes", [])
            self._build_tree()
        
        if self.registry_path.exists():
            raw_content = self.registry_path.read_text(encoding='utf-8', errors='replace')
            content = clean_content(raw_content)
            data = json.loads(content, strict=False)
            self.view_registry = data.get("view_registry", [])

    def _build_tree(self):
        """Builds a hierarchical tree from knowledge nodes."""
        tree = {}
        for node in self.knowledge_nodes:
            subject = node.get("subject", "其他")
            chapter = node.get("chapter", "未分类")
            section = node.get("section", "一般")
            
            if subject not in tree:
                tree[subject] = {}
            if chapter not in tree[subject]:
                tree[subject][chapter] = {}
            if section not in tree[subject][chapter]:
                tree[subject][chapter][section] = []
            
            tree[subject][chapter][section].append({
                "id": node["id"],
                "title": node["title"],
                "label": node.get("label", ""),
                "view_id": node.get("viz", {}).get("viz_id") or node.get("ui_binding", {}).get("default_view_id")
            })
        self.knowledge_tree = tree

    def get_tree(self):
        return self.knowledge_tree

    def get_node(self, node_id: str):
        for node in self.knowledge_nodes:
            if node["id"] == node_id:
                return node
        return None

    def get_quick_actions(self, ids: List[str]):
        results = []
        for node in self.knowledge_nodes:
            if node["id"] in ids:
                results.append({
                    "id": node["id"],
                    "subject": node["subject"],
                    "grade": node.get("chapter", ""),
                    "title": node["title"],
                    "starter_prompt": node.get("details", "")[:100] + "...",
                    "view_id": node.get("viz", {}).get("viz_id") or node.get("ui_binding", {}).get("default_view_id"),
                    "default_params": {} # To be filled or handled dynamically
                })
        return results

# Trigger reload
