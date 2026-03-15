"""
批量生成物理概念动画
从教材目录中提取概念并逐一生成可视化
"""
import requests
import time
import re
from pathlib import Path
from animation_database import AnimationDatabase

class PhysicsAnimationGenerator:
    def __init__(self, api_url: str = "http://localhost:8002", db_path: str = "animations.db"):
        self.api_url = api_url
        self.db = AnimationDatabase(db_path)

    def extract_concepts_from_toc(self, toc_file: str) -> list:
        """从目录文件中提取物理概念"""
        with open(toc_file, 'r', encoding='utf-8') as f:
            content = f.read()

        concepts = []

        # 提取章节标题和小节标题
        lines = content.split('\n')
        current_chapter = None

        for line in lines:
            line = line.strip()

            # 匹配章节标题 (如: # 第十四章 气体动理论 1)
            # 使用 [^章]+ 来匹配中文数字章节号
            chapter_match = re.match(r'^#\s+第([^章]+)章\s+(.+?)(?:\s+\d+)?$', line)
            if chapter_match:
                chapter_num = chapter_match.group(1)
                chapter_name = chapter_match.group(2).strip()
                current_chapter = f"第{chapter_num}章 {chapter_name}"
                print(f"  发现章节: {current_chapter}")
                continue

            # 匹配小节标题 (如: 14-1 热力学系统的状态… 3)
            section_match = re.match(r'^(\d+-\d+)\s+(.+?)(?:\s+[…\.]+)?\s*\d*\s*$', line)
            if section_match and current_chapter:
                section_num = section_match.group(1)
                concept_name = section_match.group(2).strip()

                # 清理概念名称（移除末尾的省略号）
                concept_name = re.sub(r'[…\.]+$', '', concept_name)
                concept_name = concept_name.strip()

                if concept_name and len(concept_name) > 2:
                    concepts.append({
                        'concept': concept_name,
                        'chapter': current_chapter,
                        'section': section_num,
                        'category': '大学物理'
                    })
                    print(f"    提取概念: {concept_name}")

        return concepts

    def generate_animation(self, concept: str, quality: str = "l", style: str = "educational") -> dict:
        """调用 API 生成动画"""
        try:
            response = requests.post(
                f"{self.api_url}/generate",
                json={
                    "concept": concept,
                    "quality": quality,
                    "style": style
                },
                timeout=300  # 5分钟超时
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def batch_generate(self, concepts: list, skip_existing: bool = True,
                      delay: int = 2, max_concepts: int = None):
        """批量生成动画"""
        total = len(concepts)
        if max_concepts:
            total = min(total, max_concepts)
            concepts = concepts[:max_concepts]

        print(f"\n{'='*60}")
        print(f"开始批量生成动画")
        print(f"总概念数: {total}")
        print(f"跳过已存在: {skip_existing}")
        print(f"{'='*60}\n")

        success_count = 0
        skip_count = 0
        fail_count = 0

        for i, item in enumerate(concepts, 1):
            concept = item['concept']
            chapter = item['chapter']
            section = item.get('section', '')
            category = item.get('category', '物理')

            print(f"\n[{i}/{total}] 处理概念: {concept}")
            print(f"  章节: {chapter}")
            print(f"  小节: {section}")

            # 检查是否已存在
            if skip_existing and self.db.concept_exists(concept):
                print(f"  ⏭️  跳过 (已存在)")
                skip_count += 1
                continue

            # 生成动画
            print(f"  🎬 开始生成...")
            result = self.generate_animation(concept, quality="l", style="simple")

            if result.get('success'):
                # 保存到数据库
                video_path = result.get('video_path', '')
                code = result.get('code', '')

                # 转换相对路径为绝对路径
                if video_path.startswith('/video/'):
                    video_path = video_path.replace('/video/',
                        '/Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/concept2animation/media/')

                self.db.add_animation(
                    concept=concept,
                    video_path=video_path,
                    code=code,
                    quality="l",
                    style="simple",
                    ai_provider="claude",
                    category=category,
                    chapter=chapter,
                    tags=[section, chapter]
                )

                print(f"  ✅ 成功生成")
                success_count += 1
            else:
                error = result.get('error', 'Unknown error')
                print(f"  ❌ 生成失败: {error}")
                fail_count += 1

            # 延迟，避免过载
            if i < total:
                print(f"  ⏳ 等待 {delay} 秒...")
                time.sleep(delay)

        # 打印统计
        print(f"\n{'='*60}")
        print(f"批量生成完成")
        print(f"{'='*60}")
        print(f"✅ 成功: {success_count}")
        print(f"⏭️  跳过: {skip_count}")
        print(f"❌ 失败: {fail_count}")
        print(f"总计: {total}")
        print(f"{'='*60}\n")

        # 显示数据库统计
        stats = self.db.get_statistics()
        print(f"数据库统计:")
        print(f"  总动画数: {stats['total']}")
        print(f"  按章节: {stats['by_chapter']}")

if __name__ == "__main__":
    # 配置
    TOC_FILE = "/Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/书籍/大学物理下/大学物理下分章md/大学物理学（第2版）下册目录.pdf-77c98bf1-fb03-4141-ae50-ee5da6d3edfe/full.md"

    # 创建生成器
    generator = PhysicsAnimationGenerator()

    # 提取概念
    print("📖 正在提取物理概念...")
    concepts = generator.extract_concepts_from_toc(TOC_FILE)
    print(f"\n✅ 提取到 {len(concepts)} 个概念\n")

    if len(concepts) == 0:
        print("❌ 未提取到任何概念，请检查文件路径和格式")
        exit(1)

    # 显示前10个概念
    print("前10个概念:")
    for i, item in enumerate(concepts[:10], 1):
        print(f"  {i}. {item['concept']} ({item['chapter']})")
    print()

    # 自动开始生成（生成所有概念）
    print(f"🚀 开始批量生成所有 {len(concepts)} 个概念的动画...\n")
    generator.batch_generate(concepts, skip_existing=True, delay=3, max_concepts=None)
