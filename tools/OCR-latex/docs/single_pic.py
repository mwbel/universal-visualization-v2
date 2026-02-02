from paddleocr import PaddleOCR
import layoutparser as lp
from PIL import Image
import subprocess

# 加载模型
ocr_model = PaddleOCR(use_angle_cls=True, lang='ch')  # 中文OCR
layout_model = lp.Detectron2LayoutModel(
    'lp://PubLayNet/faster_rcnn_R_50_FPN_3x/config',
    extra_config=["MODEL.ROI_HEADS.SCORE_THRESH_TEST", 0.8],
    label_map={0: "Text", 1: "Title", 2: "List", 3: "Table", 4: "Figure"}
)

# 加载图像
image_path = "/Users/Min369/Desktop/Projects/AlVisualization/DifferentialGeometry/pages/DiffGeom-pages077.png"
image = Image.open(image_path).convert("RGB")

# 分割页面布局
layout = layout_model.detect(image)

# LaTeX输出初始化
latex_output = []

# 遍历所有区域
for block in layout:
    x1, y1, x2, y2 = map(int, block.coordinates)
    cropped = image.crop((x1, y1, x2, y2))

    if block.type in ["Text", "Title", "List"]:
        result = ocr_model.ocr(np.array(cropped))
        text = ''.join([line[1][0] for line in result[0]])
        latex_output.append(text)
    elif block.type in ["Figure"]:
        latex_output.append("\\includegraphics[width=\\linewidth]{figure_placeholder}")
    elif block.type == "Table":
        latex_output.append("\\begin{tabular}{|c|c|c|} \\hline ... \\hline \\end{tabular}")
    else:
        # 尝试用LaTeXOCR处理公式（可选，LaTeX-OCR 要用 subprocess）
        cropped.save("temp_formula.png")
        latex = subprocess.getoutput("latexocr temp_formula.png")
        latex_output.append(f"\\[ {latex} \\]")

# 合并为一个 LaTeX 文本
final_latex = "\n\n".join(latex_output)

# 保存为 .tex 文件
with open("output.tex", "w", encoding="utf-8") as f:
    f.write("\\documentclass{article}\n\\usepackage{graphicx}\n\\begin{document}\n")
    f.write(final_latex)
    f.write("\n\\end{document}")
