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

# Mapping strategy for Sequence (12 nodes)
sequence_mapping = {
    "math.C07.S02.P01": "def",   # a与b的等差中项...
    "math.C07.S02.P02": "mean",  # 数列的通项公式与前n项和的关系 (Sn-an)
    "math.C07.S02.P03": "sum",   # 已知{an}为等差数列，{bn}为等比数列 (求和方法)
    "math.C07.S02.P04": "extr",  # 在等差数列{an}中，若a1>0, d<0 (最值)
    "math.C07.S02.P05": "prop",  # 已知{an}等差数列，则... (性质)
    "math.C07.S02.P06": "prop",  # 两数列前n项和比
    "math.C07.S02.P07": "sum",   # 求数列前n项和 (多种方法)
    "math.C07.S04.P01": None,    # lim (info_card)
    "math.C07.S04.P02": "limit", # 几个常见的极限
    "math.C07.S04.P03": None,    # lim (info_card)
    "math.C07.S04.P04": "limit", # 无穷等比数列各项和
    "math.C07.S03.P01": "induc", # 数学归纳法
}

# Mapping strategy for Vector (9 nodes)
vector_mapping = {
    "math.C08.S02.P01": "concept",   # 平面向量
    "math.C08.S02.P02": "linear",    # 平面向量的坐标运算
    "math.C08.S02.P03": "collinear", # 平面向量共线
    "math.C08.S03.P01": "dotprod",   # 向量数量积的定义
    "math.C08.S03.P02": "prop",      # 向量数量积的性质与夹角
    "math.C08.S03.P03": "dotprod",   # 向量投影
    "math.C08.S03.P04": "prop",      # 垂直
    "math.C08.S04.P01": "decomp",    # 平面向量基本定理
    "math.C08.S04.P02": "decomp",    # 三点共线定理
}

def update_catalog():
    catalog_path = Path('aha_knowledge_catalog.jsonc')
    with open(catalog_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    output_lines = []
    current_id = None
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Identify node ID
        id_match = re.search(r'"id":\s*"([^"]+)"', line)
        if id_match:
            current_id = id_match.group(1)
        
        # Check if we should inject viz_args
        if current_id in sequence_mapping and '"viz_id": "sequence_lab"' in line:
            module = sequence_mapping[current_id]
            if module:
                # Add viz_args after viz_id
                output_lines.append(line)
                indent = re.match(r'^\s*', line).group(0)
                output_lines.append(f'{indent}"viz_args": {{"module": "{module}"}},\n')
                i += 1
                continue
        elif current_id in vector_mapping and '"viz_id": "vector_lab"' in line:
            module = vector_mapping[current_id]
            if module:
                # Check if viz_args already exists
                has_args = False
                temp_j = i + 1
                while temp_j < i + 10 and temp_j < len(lines):
                    if '"viz_args"' in lines[temp_j]:
                        has_args = True
                        break
                    if '}' in lines[temp_j] and 'viz' not in lines[temp_j]: # End of viz object
                        break
                    temp_j += 1
                
                if not has_args:
                    output_lines.append(line)
                    indent = re.match(r'^\s*', line).group(0)
                    output_lines.append(f'{indent}"viz_args": {{"module": "{module}"}},\n')
                    i += 1
                    continue
        
        output_lines.append(line)
        i += 1

    with open(catalog_path, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)
    print("Catalog updated successfully.")

update_catalog()
