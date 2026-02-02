import layoutparser as lp
import cv2
from paddleocr import PaddleOCR
import subprocess
import os

# 初始化 PaddleOCR（中文）
ocr_model = PaddleOCR(use_angle_cls=False, lang='ch')  # cls暂时不启用

# 1. 加载图片
img_path = "test.png"  # 替换为你的图像路径
image = cv2.imread(img_path)

# 2. 使用 LayoutParser 加载检测模型
model = lp.Detectron2LayoutModel(
    config_path="lp://PubLayNet/faster_rcnn_R_50_FPN_3x/config",
    model_path="lp://PubLayNet/faster_rcnn_R_50_FPN_3x/model",
    label_map={0: "Text", 1: "Title", 2: "List", 3: "Table", 4: "Figure"},
    extra_config=["MODEL.ROI_HEADS.SCORE_THRESH_TEST", 0.8],
    device="cpu"
)

# 3. 获取分割后的版面区域
layout = model.detect(image)

# 4. 遍历每个区域，根据类型调用不同OCR或LaTeX-OCR工具
results = []

for block in layout:
    x_1, y_1, x_2, y_2 = list(map(int, block.coordinates))
    segment = image[y_1:y_2, x_1:x_2]
    segment_path = "temp_block.png"
    cv2.imwrite(segment_path, segment)

    # 简单规则：宽高比 > 3 认为是公式（你可以更智能判断）
    aspect_ratio = (x_2 - x_1) / max(1, y_2 - y_1)

    if aspect_ratio > 3:
        # 使用 LaTeX-OCR 工具识别公式（需预安装 latexocr）
        try:
            output = subprocess.check_output(['latexocr', segment_path], universal_newlines=True)
            results.append(f"$$ {output.strip()} $$")
        except Exception as e:
            results.append("[公式识别失败]")
    else:
        # 使用 PaddleOCR 识别中文
        ocr_result = ocr_model.ocr(segment_path, cls=False)
        text = ''
        for line in ocr_result:
            line_text = ''.join([word_info[1][0] for word_info in line])
            text += line_text
        results.append(text)

# 5. 输出最终 Markdown 或 LaTeX 内容
with open("output.md", "w", encoding="utf-8") as f:
    for block in results:
        f.write(block + "\n\n")

print("✅ 已生成 output.md")
