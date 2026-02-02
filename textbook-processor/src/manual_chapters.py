"""
手动章节配置工具
当 OCR 不可用时，允许手动指定章节结构
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict
from dataclasses import dataclass, asdict


@dataclass
class ChapterConfig:
    """章节配置"""
    number: int
    title: str
    page_start: int  # 1-based页码
    page_end: int    # 1-based页码
    level: int = 1


def create_sample_config(output_path: str = "manual_chapters.json"):
    """
    创建示例配置文件

    Args:
        output_path: 输出文件路径
    """
    sample_chapters = [
        {
            "number": 1,
            "title": "第一章 概率论的基本概念",
            "page_start": 16,
            "page_end": 50,
            "level": 1
        },
        {
            "number": 2,
            "title": "第二章 随机变量及其分布",
            "page_start": 51,
            "page_end": 100,
            "level": 1
        },
        {
            "number": 3,
            "title": "第三章 多维随机变量及其分布",
            "page_start": 101,
            "page_end": 150,
            "level": 1
        },
        {
            "number": 4,
            "title": "第四章 随机变量的数字特征",
            "page_start": 151,
            "page_end": 200,
            "level": 1
        },
        {
            "number": 5,
            "title": "第五章 大数定律与中心极限定理",
            "page_start": 201,
            "page_end": 230,
            "level": 1
        },
        {
            "number": 6,
            "title": "第六章 样本及抽样分布",
            "page_start": 231,
            "page_end": 260,
            "level": 1
        },
        {
            "number": 7,
            "title": "第七章 参数估计",
            "page_start": 261,
            "page_end": 310,
            "level": 1
        },
        {
            "number": 8,
            "title": "第八章 假设检验",
            "page_start": 311,
            "page_end": 360,
            "level": 1
        }
    ]

    config = {
        "title": "概率论与数理统计第五版",
        "description": "手动指定的章节配置（示例）",
        "note": "请根据实际书籍内容修改页码范围",
        "chapters": sample_chapters
    }

    output_file = Path(output_path)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    print(f"✓ 已创建示例配置文件: {output_file}")
    print(f"  请根据实际书籍内容编辑此文件")
    print()
    print("配置格式:")
    print("- number: 章节编号")
    print("- title: 章节标题")
    print("- page_start: 起始页码（从1开始）")
    print("- page_end: 结束页码（从1开始）")
    print("- level: 层级（1=章，2=节，3=小节）")

    return output_file


def validate_config(config_path: str) -> bool:
    """
    验证配置文件

    Args:
        config_path: 配置文件路径

    Returns:
        是否有效
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        if 'chapters' not in config:
            print("✗ 配置文件缺少 'chapters' 字段")
            return False

        chapters = config['chapters']
        if not chapters:
            print("✗ 章节列表为空")
            return False

        # 验证每个章节
        for i, chapter in enumerate(chapters):
            required_fields = ['number', 'title', 'page_start', 'page_end']
            for field in required_fields:
                if field not in chapter:
                    print(f"✗ 第 {i+1} 个章节缺少字段: {field}")
                    return False

            # 验证页码
            if chapter['page_start'] > chapter['page_end']:
                print(f"✗ 第 {i+1} 个章节页码无效: 起始页 > 结束页")
                return False

            # 验证页码连续性
            if i > 0:
                prev_chapter = chapters[i - 1]
                if chapter['page_start'] <= prev_chapter['page_end']:
                    print(f"⚠️  第 {i+1} 个章节与上一章节页码重叠")

        print(f"✓ 配置文件有效")
        print(f"  共 {len(chapters)} 个章节")
        print(f"  页码范围: {chapters[0]['page_start']} - {chapters[-1]['page_end']}")

        # 显示章节列表
        print()
        print("章节列表:")
        for chapter in chapters:
            print(f"  {chapter['number']}. {chapter['title']} (第 {chapter['page_start']}-{chapter['page_end']} 页)")

        return True

    except FileNotFoundError:
        print(f"✗ 配置文件不存在: {config_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ JSON 格式错误: {e}")
        return False
    except Exception as e:
        print(f"✗ 验证失败: {e}")
        return False


def convert_to_pdf_analyzer_format(config_path: str, output_path: str = None):
    """
    转换为 pdf_analyzer 兼容格式

    Args:
        config_path: 手动配置文件路径
        output_path: 输出文件路径（可选）
    """
    if output_path is None:
        output_path = Path(config_path).stem + "_converted.json"

    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    # 转换为 pdf_analyzer 的 ChapterInfo 格式
    chapters_data = []
    for chapter in config['chapters']:
        chapter_info = {
            "chapter_number": chapter['number'],
            "title": chapter['title'],
            "level": chapter.get('level', 1),
            "page_start": chapter['page_start'] - 1,  # 转换为 0-based
            "page_end": chapter['page_end'] - 1,      # 转换为 0-based
        }
        chapters_data.append(chapter_info)

    output_config = {
        "title": config.get('title', ''),
        "chapters": chapters_data
    }

    output_file = Path(output_path)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_config, f, ensure_ascii=False, indent=2)

    print(f"✓ 已转换为 pdf_analyzer 格式: {output_file}")
    return output_file


def interactive_create():
    """交互式创建配置"""
    print("=" * 60)
    print("手动章节配置工具")
    print("=" * 60)
    print()

    chapters = []
    print("请输入章节信息（输入空行完成）")
    print()

    while True:
        number = len(chapters) + 1

        print(f"章节 {number}")
        title = input(f"  标题: ").strip()
        if not title:
            break

        page_start = input(f"  起始页码: ").strip()
        if not page_start:
            break
        page_start = int(page_start)

        page_end = input(f"  结束页码: ").strip()
        if not page_end:
            break
        page_end = int(page_end)

        chapter = {
            "number": number,
            "title": title,
            "page_start": page_start,
            "page_end": page_end,
            "level": 1
        }
        chapters.append(chapter)
        print()

    if not chapters:
        print("未输入任何章节")
        return

    config = {
        "title": input("书籍标题: ").strip(),
        "description": "手动创建的章节配置",
        "chapters": chapters
    }

    output_path = input("\n保存到文件 (默认: manual_chapters.json): ").strip()
    if not output_path:
        output_path = "manual_chapters.json"

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 配置已保存到: {output_path}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='手动章节配置工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 创建示例配置文件
  %(prog)s --create-sample

  # 验证配置文件
  %(prog)s --validate manual_chapters.json

  # 转换为 pdf_analyzer 格式
  %(prog)s --convert manual_chapters.json

  # 交互式创建配置
  %(prog)s --interactive
        """
    )

    parser.add_argument('--create-sample', action='store_true',
                       help='创建示例配置文件')
    parser.add_argument('--validate', metavar='CONFIG',
                       help='验证配置文件')
    parser.add_argument('--convert', metavar='CONFIG',
                       help='转换为 pdf_analyzer 格式')
    parser.add_argument('--interactive', action='store_true',
                       help='交互式创建配置')

    args = parser.parse_args()

    if args.create_sample:
        create_sample_config()
    elif args.validate:
        validate_config(args.validate)
    elif args.convert:
        convert_to_pdf_analyzer_format(args.convert)
    elif args.interactive:
        interactive_create()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
