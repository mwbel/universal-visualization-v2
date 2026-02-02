# PDF导出说明

## 问题
原Markdown文件导出为PDF后，表格和数学公式的字体过小，不易阅读。

## 解决方案

### 方法1：使用自动导出脚本（推荐）

直接运行：
```bash
./export_pdf_large_font.sh
```

这将生成 `沪教版高中数学1数学术语中英文对照20251223.v1.large-font.pdf`，字体约为14pt。

### 方法2：使用Typora等Markdown编辑器

1. 在Typora中打开Markdown文件
2. 点击 `文件` → `导出` → `PDF`
3. CSS样式已添加到文件中，会自动增大表格字体

### 方法3：使用Pandoc手动导出（自定义字体大小）

#### 小字体版本（12pt - 原始大小）
```bash
pandoc "沪教版高中数学1数学术语中英文对照20251223.v1.md" \
    -o "output-small.pdf" \
    --pdf-engine=xelatex \
    --variable=mainfont:"PingFang SC" \
    --variable=CJKmainfont:"PingFang SC" \
    --variable=fontsize:12pt \
    --variable=geometry:margin=2cm \
    --include-in-header=preamble.tex
```

#### 中等字体版本（14pt - 当前默认）
```bash
pandoc "沪教版高中数学1数学术语中英文对照20251223.v1.md" \
    -o "output-medium.pdf" \
    --pdf-engine=xelatex \
    --variable=mainfont:"PingFang SC" \
    --variable=CJKmainfont:"PingFang SC" \
    --variable=fontsize:12pt \
    --variable=geometry:margin=2cm \
    --include-in-header=preamble-14pt.tex
```

#### 大字体版本（17pt - 适合打印和阅读）
修改 `preamble.tex` 中的 `\large` 为 `\Large`（注意大小写），然后：
```bash
pandoc "沪教版高中数学1数学术语中英文对照20251223.v1.md" \
    -o "output-large.pdf" \
    --pdf-engine=xelatex \
    --variable=mainfont:"PingFang SC" \
    --variable=CJKmainfont:"PingFang SC" \
    --variable=fontsize:12pt \
    --variable=geometry:margin=2cm \
    --include-in-header=preamble-large.tex
```

## 字体大小对应关系

- `\normalsize` = 12pt（基础大小）
- `\large` = 14pt（当前默认，推荐）
- `\Large` = 17pt（较大，适合打印）
- `\LARGE` = 20pt（很大）
- `\huge` = 24pt（非常大）

## 文件说明

- `沪教版高中数学1数学术语中英文对照20251223.v1.md` - 原始Markdown文件（已添加CSS样式）
- `preamble.tex` - LaTeX导出头文件（控制字体大小和表格样式）
- `export_pdf_large_font.sh` - 自动导出脚本
- `沪教版高中数学1数学术语中英文对照20251223.v1.large-font.pdf` - 导出的大字体PDF

## 自定义字体大小

如果需要调整字体大小，编辑 `preamble.tex` 文件，修改第11行的字体命令：

```latex
% 改为更大的字体
\Large      % 17pt
\LARGE      % 20pt
\huge       % 24pt
\Huge       % 28pt
```

然后重新运行 `./export_pdf_large_font.sh`。

## 注意事项

1. 确保已安装 pandoc 和 LaTeX 环境（如 MacTeX 或 TeX Live）
2. 中文字体使用的是 PingFang SC，如果系统没有该字体，可以改为其他中文字体（如 SimSun）
3. 表格行高已设置为1.3倍，便于阅读
4. PDF包含目录和章节编号

## 验证安装

检查是否安装了必要的工具：
```bash
# 检查pandoc
which pandoc

# 检查xelatex
which xelatex

# 检查中文字体
fc-list | grep "PingFang SC"
```
