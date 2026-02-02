# save as split_pdf.py
# from PyPDF2 import PdfReader, PdfWriter
from pypdf import PdfReader, PdfWriter
import sys, os

src = sys.argv[1]
chunk = int(sys.argv[2]) if len(sys.argv) > 2 else 50

reader = PdfReader(src)
n = len(reader.pages)
base = os.path.splitext(os.path.basename(src))[0]

for i in range(0, n, chunk):
    w = PdfWriter()
    for j in range(i, min(i+chunk, n)):
        w.add_page(reader.pages[j])
    with open(f"{base}_part_{i//chunk+1}.pdf", "wb") as f:
        w.write(f)
print("done.")
