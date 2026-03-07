import os
import logging
from typing import List, Dict, Any
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False

class OCRService:
    _instance = None
    _ocr = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OCRService, cls).__new__(cls)
        return cls._instance

    def _get_ocr(self):
        if self._ocr is None and PADDLE_AVAILABLE:
            # Initialize PaddleOCR with Chinese support
            # use_angle_cls=True enables orientation detection
            # lang='ch' supports both Chinese and English
            try:
                # Disable model source check to speed up startup
                os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
                # Use mobile models (PP-OCRv4) which are lighter
                # The version of PaddleOCR installed via Paddlex uses these parameters
                self._ocr = PaddleOCR(
                    use_textline_orientation=True, 
                    lang='ch',
                    ocr_version='PP-OCRv4'
                )
            except Exception as e:
                logging.error(f"Failed to initialize PaddleOCR: {e}")
        return self._ocr

    def process_image(self, image_path: str) -> str:
        """
        Processes an image and returns the recognized text in Markdown format.
        """
        if not PADDLE_AVAILABLE:
            return "Error: PaddleOCR is not installed. Please run `pip install paddlepaddle paddleocr`."

        ocr = self._get_ocr()
        if not ocr:
            return "Error: OCR engine initialization failed."

        try:
            # Use predict instead of ocr
            result = ocr.predict(image_path)
            if not result or not result[0]:
                return "未通过图像识别到任何文字内容。"

            # In latest PaddleOCR/PaddleX, result[0] is an OCRResult object
            # treating it as a dict to get texts and boxes
            item = result[0]
            texts = item.get('rec_texts', [])
            boxes = item.get('rec_boxes', [])
            scores = item.get('rec_scores', [])

            if not texts:
                return "未在识别结果中找到文字内容。"

            # Create a list of pairs [(box, (text, score)), ...] to match the formatting logic
            formatted_results = []
            for i in range(len(texts)):
                # The sorting/formatting logic expects a box as [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
                # or at least that box[0][1] is a top coordinate.
                # Since our box is [xmin, ymin, xmax, ymax], we'll wrap it to be compatible.
                box = boxes[i].tolist() if hasattr(boxes[i], 'tolist') else boxes[i]
                # Wrapping: box_wrapped[0] = [xmin, ymin]
                box_wrapped = [[box[0], box[1]]] 
                formatted_results.append((box_wrapped, (texts[i], scores[i] if i < len(scores) else 1.0)))
            
            # Sort boxes by top coordinate (ymin) primarily, then left coordinate (xmin)
            formatted_results.sort(key=lambda x: (x[0][0][1], x[0][0][0]))

            markdown_content = self._format_as_markdown(formatted_results)
            return markdown_content
        except Exception as e:
            logging.error(f"OCR processing error: {e}")
            return f"识别过程中发生错误: {str(e)}"

    def _format_as_markdown(self, ocr_results: List[Any]) -> str:
        """
        Converts OCR raw results into basic Markdown text.
        Attempts to preserve some layout by grouping items on similar Y-offsets.
        """
        if not ocr_results:
            return ""

        output_lines = []
        current_y = -1
        current_line_text = []
        
        # Line height threshold (pixels) to consider text on the same row
        Y_THRESHOLD = 15 

        for box, (text, score) in ocr_results:
            top_y = box[0][1]
            
            if current_y == -1:
                current_y = top_y
                current_line_text.append(text)
            elif abs(top_y - current_y) < Y_THRESHOLD:
                current_line_text.append(text)
            else:
                # New line detected
                output_lines.append(" ".join(current_line_text))
                current_line_text = [text]
                current_y = top_y
        
        # Append the last line
        if current_line_text:
            output_lines.append(" ".join(current_line_text))

        return "\n\n".join(output_lines)

# Singleton instance access
def get_ocr_service():
    return OCRService()
