for img in ./pages/DiffGeom-pages*.png; do
    paddleocr --image_dir="$img" --use_angle_cls=true --lang=ch --output="./ocr_json/"
done