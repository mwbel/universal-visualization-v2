#!/usr/bin/env python3
"""
物理动画批量测试脚本
用于快速测试所有物理动画是否能正常运行
"""

import subprocess
import sys
import os
from pathlib import Path


class PhysicsAnimationTester:
    """物理动画测试器"""

    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.results = []

    def run_animation(self, script_file: str, scene_name: str, quality: str = "l") -> bool:
        """
        运行单个动画

        Args:
            script_file: Python脚本文件名
            scene_name: 场景类名
            quality: 质量等级 (l/m/h/k)

        Returns:
            bool: 是否成功
        """
        print(f"\n{'='*60}")
        print(f"测试: {scene_name}")
        print(f"文件: {script_file}")
        print(f"{'='*60}")

        script_path = self.script_dir / script_file

        if not script_path.exists():
            print(f"❌ 错误: 文件不存在 {script_path}")
            return False

        # 构建manim命令
        cmd = [
            "manim",
            f"-pq{quality}",
            str(script_path),
            scene_name
        ]

        try:
            # 运行命令
            result = subprocess.run(
                cmd,
                cwd=self.script_dir,
                capture_output=True,
                text=True,
                timeout=120  # 2分钟超时
            )

            if result.returncode == 0:
                print(f"✅ 成功: {scene_name}")
                return True
            else:
                print(f"❌ 失败: {scene_name}")
                print(f"错误信息:\n{result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            print(f"⏱️ 超时: {scene_name} (超过120秒)")
            return False
        except Exception as e:
            print(f"❌ 异常: {scene_name}")
            print(f"错误: {str(e)}")
            return False

    def test_all_basic_animations(self):
        """测试所有基础物理动画"""
        print("\n" + "="*60)
        print("开始测试基础物理动画")
        print("="*60)

        animations = [
            ("physics_generator.py", "NewtonSecondLaw"),
            ("physics_generator.py", "SimpleHarmonicMotion"),
            ("physics_generator.py", "KineticEnergyTheorem"),
            ("physics_generator.py", "ElectricField"),
        ]

        for script, scene in animations:
            success = self.run_animation(script, scene)
            self.results.append({
                "script": script,
                "scene": scene,
                "success": success
            })

    def test_all_advanced_animations(self):
        """测试所有高级物理动画"""
        print("\n" + "="*60)
        print("开始测试高级物理动画")
        print("="*60)

        animations = [
            ("advanced_physics.py", "ProjectileMotion"),
            ("advanced_physics.py", "WaveInterference"),
            ("advanced_physics.py", "ElectromagneticInduction"),
            ("advanced_physics.py", "DopplerEffect"),
            ("advanced_physics.py", "PhotoelectricEffect"),
        ]

        for script, scene in animations:
            success = self.run_animation(script, scene)
            self.results.append({
                "script": script,
                "scene": scene,
                "success": success
            })

    def print_summary(self):
        """打印测试摘要"""
        print("\n" + "="*60)
        print("测试摘要")
        print("="*60)

        total = len(self.results)
        success_count = sum(1 for r in self.results if r["success"])
        fail_count = total - success_count

        print(f"\n总计: {total} 个动画")
        print(f"✅ 成功: {success_count}")
        print(f"❌ 失败: {fail_count}")
        print(f"成功率: {success_count/total*100:.1f}%")

        if fail_count > 0:
            print("\n失败的动画:")
            for r in self.results:
                if not r["success"]:
                    print(f"  - {r['scene']} ({r['script']})")

        print("\n" + "="*60)

    def run_all_tests(self):
        """运行所有测试"""
        print("\n🎬 物理动画测试开始")
        print(f"工作目录: {self.script_dir}")

        # 检查manim是否安装
        try:
            subprocess.run(["manim", "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ 错误: Manim未安装或不在PATH中")
            print("请运行: pip install manim")
            sys.exit(1)

        # 运行测试
        self.test_all_basic_animations()
        self.test_all_advanced_animations()

        # 打印摘要
        self.print_summary()


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="物理动画测试脚本")
    parser.add_argument(
        "--basic",
        action="store_true",
        help="只测试基础动画"
    )
    parser.add_argument(
        "--advanced",
        action="store_true",
        help="只测试高级动画"
    )
    parser.add_argument(
        "--scene",
        type=str,
        help="测试特定场景 (格式: script.py:SceneName)"
    )

    args = parser.parse_args()

    tester = PhysicsAnimationTester()

    if args.scene:
        # 测试特定场景
        try:
            script, scene = args.scene.split(":")
            tester.run_animation(script, scene)
        except ValueError:
            print("❌ 错误: 场景格式应为 script.py:SceneName")
            sys.exit(1)
    elif args.basic:
        # 只测试基础动画
        tester.test_all_basic_animations()
        tester.print_summary()
    elif args.advanced:
        # 只测试高级动画
        tester.test_all_advanced_animations()
        tester.print_summary()
    else:
        # 测试所有动画
        tester.run_all_tests()


if __name__ == "__main__":
    main()
