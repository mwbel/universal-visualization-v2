import os
import shutil

# 需要整理的目录
base_dir = os.path.abspath(os.path.dirname(__file__))

# 新的目录结构
envs_dir = os.path.join(base_dir, "envs")
scripts_dir = os.path.join(base_dir, "scripts")
docs_dir = os.path.join(base_dir, "docs")
output_dir = os.path.join(base_dir, "output")

# 确保目标目录存在
for d in [envs_dir, scripts_dir, docs_dir, output_dir]:
    os.makedirs(d, exist_ok=True)

# 1. 环境目录迁移
for env in ["latexocr-env", "mineru-env", "mineru-mac-env"]:
    src = os.path.join(base_dir, env)
    if os.path.isdir(src):
        dst = os.path.join(envs_dir, env)
        print(f"Moving {src} -> {dst}")
        shutil.move(src, dst)

# 2. 脚本迁移
for script in ["extract_pdf.py", "split_pdf.py", "install_mineru_mac.sh"]:
    src = os.path.join(base_dir, script)
    if os.path.isfile(src):
        dst = os.path.join(scripts_dir, script)
        print(f"Moving {src} -> {dst}")
        shutil.move(src, dst)

# 3. 文档迁移
for doc_dir in ["product_documents"]:
    src = os.path.join(base_dir, doc_dir)
    if os.path.isdir(src):
        dst = os.path.join(docs_dir, doc_dir)
        print(f"Moving {src} -> {dst}")
        shutil.move(src, dst)

# 4. 输出目录整理
for out_dir in ["output_md", "MinerU解析", "OCR latex"]:
    src = os.path.join(base_dir, out_dir)
    if os.path.exists(src):
        dst = os.path.join(output_dir, out_dir.replace(" ", "_"))
        print(f"Moving {src} -> {dst}")
        shutil.move(src, dst)

print("\n✅ 整理完成！推荐现在的结构：")
print("""
OCR-latex/
├── envs/
│   ├── latexocr-env/
│   ├── mineru-env/
│   └── mineru-mac-env/
├── LaTeX-OCR/
├── MinerU/
├── data/
├── output/
│   ├── output_md/
│   ├── MinerU解析/
│   └── OCR_latex/
├── docs/
│   └── product_documents/
├── scripts/
│   ├── extract_pdf.py
│   ├── split_pdf.py
│   └── install_mineru_mac.sh
└── requirements.txt
""")
