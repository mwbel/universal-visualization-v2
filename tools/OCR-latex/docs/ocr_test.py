from paddleocr import PaddleOCR

ocr = PaddleOCR(use_textline_orientation=True, lang='ch')  # 替代 use_angle_cls
result = ocr.ocr('test.png')  # 不再使用 cls=True
for line in result:
    print(line)