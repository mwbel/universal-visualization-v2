import re
import xml.etree.ElementTree as ET
from xml.dom import minidom

def parse_markdown_to_structure(markdown_content):
    structure = []
    current_chapter = None
    current_section = None
    current_subsection = None

    lines = markdown_content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.startswith('# '):
            title = line[2:].strip()
            current_chapter = {"title": title, "sections": []}
            structure.append(current_chapter)
            current_section = None
            current_subsection = None
        elif line.startswith('## '):
            title = line[3:].strip()
            if current_chapter:
                current_section = {"title": title, "subsections": []}
                current_chapter["sections"].append(current_section)
                current_subsection = None
            else:
                # Handle case where ## appears before # (shouldn't happen with well-formed markdown)
                current_chapter = {"title": "Untitled Chapter", "sections": []}
                structure.append(current_chapter)
                current_section = {"title": title, "subsections": []}
                current_chapter["sections"].append(current_section)
                current_subsection = None
        elif line.startswith('### '):
            title = line[4:].strip()
            if current_section:
                current_subsection = {"title": title, "items": []}
                current_section["subsections"].append(current_subsection)
            elif current_chapter:
                # Handle case where ### appears before ##
                current_section = {"title": "Untitled Section", "subsections": []}
                current_chapter["sections"].append(current_section)
                current_subsection = {"title": title, "items": []}
                current_section["subsections"].append(current_subsection)
            else:
                # Handle case where ### appears before #
                current_chapter = {"title": "Untitled Chapter", "sections": []}
                structure.append(current_chapter)
                current_section = {"title": "Untitled Section", "subsections": []}
                current_chapter["sections"].append(current_section)
                current_subsection = {"title": title, "items": []}
                current_section["subsections"].append(current_subsection)
        elif line.startswith('- '):
            item = line[2:].strip()
            if current_subsection:
                current_subsection["items"].append(item)
            elif current_section:
                # If no subsection, add to section directly
                if "items" not in current_section:
                    current_section["items"] = []
                current_section["items"].append(item)
            elif current_chapter:
                # If no section, add to chapter directly
                if "items" not in current_chapter:
                    current_chapter["items"] = []
                current_chapter["items"].append(item)
            else:
                # Top-level item
                structure.append({"title": item, "type": "item"})
    return structure

def generate_drawio_xml(structure):
    root = ET.Element("mxfile", host="app.diagrams.net", agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36", version="24.7.5")
    diagram = ET.SubElement(root, "diagram", id="mindmap", name="Page-1")
    mxgraphmodel = ET.SubElement(diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="850", pageHeight="1100", math="0", shadow="0")
    root_cell = ET.SubElement(mxgraphmodel, "root")
    
    # Default cells
    ET.SubElement(root_cell, "mxCell", id="0")
    ET.SubElement(root_cell, "mxCell", id="1", parent="0")

    # Mindmap root node
    root_node_id = "2"
    root_node_value = "物理必修 第一册 - 关键公式与定理"
    root_node_style = "shape=cloud;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#000000;fontSize=24;"
    root_node_cell = ET.SubElement(root_cell, "mxCell", id=root_node_id, value=root_node_value, style=root_node_style, vertex="1", parent="1")
    root_node_geometry = ET.SubElement(root_node_cell, "mxGeometry", x="300", y="100", width="250", height="80")
    root_node_geometry.set("as", "geometry")

    node_counter = 2
    
    # Function to calculate text height for dynamic node sizing
    def get_text_height(text, font_size, max_width):
        # This is a simplified estimation. A real browser would render text to get exact height.
        # Assuming average character width and line height.
        chars_per_line = max_width / (font_size * 0.6) # rough estimate
        num_lines = max(1, len(text) / chars_per_line)
        return num_lines * (font_size * 1.5) # rough line height

    def add_node(parent_id, value, style, x, y, width, font_size, parent_cell, edge_style="edgeStyle=orthogonalEdgeStyle;html=1;align=left;verticalAlign=bottom;endArrow=open;endFill=0;strokeColor=#000000;"):
        nonlocal node_counter
        node_counter += 1
        node_id = str(node_counter)
        
        # Estimate height based on content
        estimated_height = max(40, get_text_height(value, font_size, width))

        node_cell = ET.SubElement(parent_cell, "mxCell", id=node_id, value=value, style=style, vertex="1", parent="1")
        node_geometry = ET.SubElement(node_cell, "mxGeometry", x=str(x), y=str(y), width=str(width), height=str(estimated_height))
        node_geometry.set("as", "geometry")

        # Add edge
        node_counter += 1
        edge_id = str(node_counter)
        edge_cell = ET.SubElement(parent_cell, "mxCell", id=edge_id, style=edge_style, edge="1", parent="1", source=parent_id, target=node_id)
        edge_geometry = ET.SubElement(edge_cell, "mxGeometry", relative="1")
        edge_geometry.set("as", "geometry")
        
        return node_id, y + estimated_height + 30 # Return new y_offset for next node, with more spacing

    current_y = 250
    chapter_x_start = 50
    section_x_offset = 280
    subsection_x_offset = 250
    item_x_offset = 220

    for chapter_idx, chapter in enumerate(structure):
        if chapter.get("type") == "item":
            _, current_y = add_node(root_node_id, chapter["title"], "rounded=0;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#000000;fontSize=16;", chapter_x_start, current_y, 200, 16, root_cell)
            continue

        chapter_node_x = chapter_x_start
        chapter_id, chapter_y_end = add_node(root_node_id, chapter["title"], "rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#000000;fontSize=20;", chapter_node_x, current_y, 250, 20, root_cell)
        
        section_y_start = chapter_y_end
        current_section_x = chapter_node_x + section_x_offset

        if "items" in chapter:
            for item_idx, item in enumerate(chapter["items"]):
                _, section_y_start = add_node(chapter_id, item, "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=14;", current_section_x, section_y_start + (item_idx * 40), 300, 14, root_cell)

        for section_idx, section in enumerate(chapter.get("sections", [])):
            section_id, section_y_end = add_node(chapter_id, section["title"], "rounded=0;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontColor=#000000;fontSize=18;", current_section_x, section_y_start + (section_idx * 100), 220, 18, root_cell)
            
            subsection_y_start = section_y_end
            current_subsection_x = current_section_x + subsection_x_offset

            if "items" in section:
                for item_idx, item in enumerate(section["items"]):
                    _, subsection_y_start = add_node(section_id, item, "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=14;", current_subsection_x, subsection_y_start + (item_idx * 40), 300, 14, root_cell)

            for subsection_idx, subsection in enumerate(section.get("subsections", [])):
                subsection_id, subsection_y_end = add_node(section_id, subsection["title"], "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontColor=#000000;fontSize=16;", current_subsection_x, subsection_y_start + (subsection_idx * 80), 200, 16, root_cell)
                
                item_y_start = subsection_y_end
                current_item_x = current_subsection_x + item_x_offset

                for item_idx, item in enumerate(subsection.get("items", [])):
                    _, item_y_start = add_node(subsection_id, item, "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=14;", current_item_x, item_y_start + (item_idx * 40), 300, 14, root_cell)
        
        current_y = max(current_y, chapter_y_end) + 100 # Ensure chapters are spaced out

    # Pretty print XML
    rough_string = ET.tostring(root, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

if __name__ == "__main__":
    # Read markdown content from the specified file
    with open("PhysicsExps/physics_summary.md", "r", encoding="utf-8") as f:
        markdown_content = f.read()
    
    parsed_structure = parse_markdown_to_structure(markdown_content)
    xml_output = generate_drawio_xml(parsed_structure)

    output_path = "PhysicsExps/physics_mindmap.xml"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(xml_output)
    print(f"Mind map XML generated successfully to {output_path}")
