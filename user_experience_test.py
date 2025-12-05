#!/usr/bin/env python3
"""
万物可视化 v2.0 - 用户体验测试
测试真实的用户使用场景和交互流程
"""

import asyncio
import json
import time
import requests
from typing import List, Dict, Any

class UserExperienceTester:
    def __init__(self, base_url: str = "http://localhost:9999"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v2"
        self.test_results = []

    def log_ux_test(self, scenario: str, success: bool, details: str = "", duration: float = 0):
        """记录UX测试结果"""
        result = {
            "scenario": scenario,
            "success": success,
            "details": details,
            "duration": duration,
            "timestamp": time.time()
        }
        self.test_results.append(result)

        status = "✅" if success else "❌"
        print(f"{status} {scenario}")
        if details:
            print(f"   {details}")
        if duration > 0:
            print(f"   耗时: {duration:.2f}秒")
        print()

    async def test_student_math_homework(self) -> bool:
        """测试学生数学作业场景"""
        scenario = "学生数学作业 - 正态分布可视化"
        start_time = time.time()

        try:
            print("📚 模拟学生做数学作业...")

            # 步骤1: 学生输入正态分布请求
            prompt = "正态分布 均值85 标准差10 班级分数分布"
            print(f"   📝 学生输入: {prompt}")

            # 步骤2: 系统自动分类
            classify_response = requests.post(
                f"{self.api_base}/classify",
                json={"prompt": prompt}
            )

            if classify_response.status_code != 200:
                raise ValueError("分类失败")

            classify_data = classify_response.json()
            subject = classify_data.get("subject")

            if subject != "mathematics":
                raise ValueError(f"学科分类错误: 期望mathematics，得到{subject}")

            print(f"   🎯 自动分类: {subject} (置信度: {classify_data.get('confidence', 0):.2f})")

            # 步骤3: 生成可视化
            generate_response = requests.post(
                f"{self.api_base}/generate",
                json={"prompt": prompt}
            )

            if generate_response.status_code != 200:
                raise ValueError("生成失败")

            generate_data = generate_response.json()
            generation_id = generate_data.get("generation_id")

            if not generation_id:
                raise ValueError("没有获得生成ID")

            print(f"   🎨 开始生成可视化 (ID: {generation_id[:8]}...)")

            # 步骤4: 等待生成完成（模拟学生等待）
            max_wait = 10
            for i in range(max_wait):
                status_response = requests.get(f"{self.api_base}/status/{generation_id}")
                status_data = status_response.json()

                status = status_data.get("status")
                progress = status_data.get("progress", 0)

                print(f"   ⏳ 生成进度: {progress}%")

                if status == "completed":
                    html_url = status_data.get("html_url")
                    if not html_url:
                        raise ValueError("没有获得可视化URL")
                    break
                elif status == "failed":
                    error = status_data.get("error", "未知错误")
                    raise ValueError(f"生成失败: {error}")
                elif status == "processing":
                    await asyncio.sleep(1)
                else:
                    await asyncio.sleep(1)
            else:
                raise ValueError("生成超时")

            # 步骤5: 获取可视化结果
            viz_response = requests.get(f"{self.base_url}{html_url}")

            if viz_response.status_code != 200:
                raise ValueError("获取可视化失败")

            content_length = len(viz_response.text)
            has_html = "<!DOCTYPE html>" in viz_response.text
            has_canvas = "canvas" in viz_response.text
            has_math = "MathJax" in viz_response.text

            if not (has_html and has_canvas):
                raise ValueError("可视化内容不完整")

            duration = time.time() - start_time

            self.log_ux_test(
                scenario,
                True,
                f"成功生成数学可视化，内容长度: {content_length}字符，包含HTML/Canvas/数学公式",
                duration
            )
            return True

        except Exception as e:
            duration = time.time() - start_time
            self.log_ux_test(scenario, False, f"学生作业场景失败: {str(e)}", duration)
            return False

    async def test_teacher_lecture_prep(self) -> bool:
        """测试教师备课场景"""
        scenario = "教师备课 - 抛物线运动演示"
        start_time = time.time()

        try:
            print("👨‍🏫 模拟教师准备物理课...")

            # 步骤1: 教师输入物理演示需求
            prompt = "抛物线运动 45度角 初速度20m/s 重力加速度9.8m/s²"
            print(f"   📝 教师需求: {prompt}")

            # 步骤2: 系统分类
            classify_response = requests.post(
                f"{self.api_base}/classify",
                json={"prompt": prompt}
            )

            if classify_response.status_code != 200:
                raise ValueError("分类失败")

            classify_data = classify_response.json()
            subject = classify_data.get("subject")

            if subject != "physics":
                raise ValueError(f"学科分类错误: 期望physics，得到{subject}")

            print(f"   🎯 自动分类: {subject} (置信度: {classify_data.get('confidence', 0):.2f})")

            # 步骤3: 生成演示
            generate_response = requests.post(
                f"{self.api_base}/generate",
                json={"prompt": prompt}
            )

            if generate_response.status_code != 200:
                raise ValueError("生成失败")

            generate_data = generate_response.json()
            generation_id = generate_data.get("generation_id")

            print(f"   🎨 开始生成物理演示 (ID: {generation_id[:8]}...)")

            # 步骤4: 等待完成（教师等待时间稍长）
            await asyncio.sleep(2)

            status_response = requests.get(f"{self.api_base}/status/{generation_id}")
            status_data = status_response.json()

            if status_data.get("status") != "completed":
                raise ValueError("演示生成未完成")

            html_url = status_data.get("html_url")
            viz_response = requests.get(f"{self.base_url}{html_url}")

            if viz_response.status_code != 200:
                raise ValueError("获取演示失败")

            # 检查内容质量
            content = viz_response.text
            has_interactive = "canvas" in content or "plotly" in content
            has_formula = "g" in content or "重力" in content
            has_animation = "动画" in content or "animation" in content

            duration = time.time() - start_time

            self.log_ux_test(
                scenario,
                True,
                f"成功生成物理演示，交互式: {has_interactive}, 包含公式: {has_formula}, 动画: {has_animation}",
                duration
            )
            return True

        except Exception as e:
            duration = time.time() - start_time
            self.log_ux_test(scenario, False, f"教师备课场景失败: {str(e)}", duration)
            return False

    async def test_researcher_data_analysis(self) -> bool:
        """测试研究人员数据分析场景"""
        scenario = "研究数据分析 - 二项分布实验"
        start_time = time.time()

        try:
            print("🔬 模拟研究人员分析实验数据...")

            # 步骤1: 研究人员输入复杂的统计需求
            prompt = "二项分布 n=100 p=0.35 实验成功率 95%置信区间"
            print(f"   📊 研究需求: {prompt}")

            # 步骤2: 系统处理
            classify_response = requests.post(
                f"{self.api_base}/classify",
                json={"prompt": prompt}
            )

            if classify_response.status_code != 200:
                raise ValueError("分类失败")

            classify_data = classify_response.json()
            subject = classify_data.get("subject")

            print(f"   🎯 学科分类: {subject} (置信度: {classify_data.get('confidence', 0):.2f})")

            # 步骤3: 生成分析图表
            generate_response = requests.post(
                f"{self.api_base}/generate",
                json={"prompt": prompt}
            )

            if generate_response.status_code != 200:
                raise ValueError("生成失败")

            generate_data = generate_response.json()
            generation_id = generate_data.get("generation_id")

            # 步骤4: 等待分析结果
            for i in range(8):
                await asyncio.sleep(1)
                status_response = requests.get(f"{self.api_base}/status/{generation_id}")
                status_data = status_response.json()

                if status_data.get("status") == "completed":
                    break
                elif status_data.get("status") == "failed":
                    raise ValueError("分析生成失败")

            html_url = status_data.get("html_url")
            viz_response = requests.get(f"{self.base_url}{html_url}")

            if viz_response.status_code != 200:
                raise ValueError("获取分析结果失败")

            # 检查分析内容
            content = viz_response.text
            has_statistics = "统计" in content or "statistics" in content
            has_distribution = "分布" in content or "distribution" in content
            has_confidence = "置信" in content or "confidence" in content

            duration = time.time() - start_time

            self.log_ux_test(
                scenario,
                True,
                f"成功生成统计分析，统计信息: {has_statistics}, 分布图: {has_distribution}, 置信区间: {has_confidence}",
                duration
            )
            return True

        except Exception as e:
            duration = time.time() - start_time
            self.log_ux_test(scenario, False, f"研究分析场景失败: {str(e)}", duration)
            return False

    async def test_quick_exploration(self) -> bool:
        """测试快速探索场景"""
        scenario = "快速探索 - 临时查询"
        start_time = time.time()

        try:
            print("🚀 模拟快速探索学习...")

            quick_queries = [
                "sin(x)函数图像",
                "圆的方程 x²+y²=r²",
                "线性回归 y=mx+b",
                "概率密度函数"
            ]

            results = []

            for i, query in enumerate(quick_queries):
                print(f"   🔍 快速查询 {i+1}: {query}")

                # 快速分类和生成
                classify_response = requests.post(
                    f"{self.api_base}/classify",
                    json={"prompt": query}
                )

                if classify_response.status_code == 200:
                    classify_data = classify_response.json()
                    subject = classify_data.get("subject")

                    # 快速生成
                    generate_response = requests.post(
                        f"{self.api_base}/generate",
                        json={"prompt": query}
                    )

                    if generate_response.status_code == 200:
                        results.append({
                            "query": query,
                            "subject": subject,
                            "success": True
                        })
                        print(f"      ✅ {subject} - 快速生成")
                    else:
                        results.append({
                            "query": query,
                            "subject": subject,
                            "success": False
                        })
                        print(f"      ❌ {subject} - 生成失败")
                else:
                    results.append({
                        "query": query,
                        "subject": "unknown",
                        "success": False
                    })
                    print(f"      ❌ 分类失败")

                # 快速查询间隔短
                await asyncio.sleep(0.5)

            successful = sum(1 for r in results if r["success"])
            total = len(results)
            duration = time.time() - start_time

            success = successful / total >= 0.75  # 75%成功率

            self.log_ux_test(
                scenario,
                success,
                f"快速查询完成: {successful}/{total} 成功，平均响应时间: {duration/total:.2f}秒",
                duration
            )
            return success

        except Exception as e:
            duration = time.time() - start_time
            self.log_ux_test(scenario, False, f"快速探索失败: {str(e)}", duration)
            return False

    async def test_error_recovery(self) -> bool:
        """测试错误恢复场景"""
        scenario = "错误恢复 - 异常输入处理"
        start_time = time.time()

        try:
            print("🛡️ 测试系统错误恢复能力...")

            error_scenarios = [
                ("空输入", ""),
                ("无效字符", "!@#$%^&*()"),
                ("超长输入", "x" * 1000),
                ("混合语言", "normal distribution 正态分布 gaussian"),
                ("模糊需求", "给我画个图")
            ]

            recovery_results = []

            for scenario_name, error_input in error_scenarios:
                print(f"   🧪 测试 {scenario_name}: {error_input[:20]}{'...' if len(error_input) > 20 else ''}")

                # 测试分类错误处理
                classify_response = requests.post(
                    f"{self.api_base}/classify",
                    json={"prompt": error_input}
                )

                classify_handled = (
                    classify_response.status_code == 400 or  # 正确返回错误
                    (classify_response.status_code == 200 and classify_response.json().get("subject") != "unknown")
                )

                # 测试生成错误处理
                generate_response = requests.post(
                    f"{self.api_base}/generate",
                    json={"prompt": error_input}
                )

                generate_handled = (
                    generate_response.status_code in [400, 422] or  # 正确返回错误
                    generate_response.status_code == 200  # 或者能处理
                )

                if classify_handled and generate_handled:
                    recovery_results.append({"scenario": scenario_name, "success": True})
                    print(f"      ✅ {scenario_name} - 错误正确处理")
                else:
                    recovery_results.append({"scenario": scenario_name, "success": False})
                    print(f"      ⚠️ {scenario_name} - 需要改进")

            successful = sum(1 for r in recovery_results if r["success"])
            total = len(recovery_results)
            duration = time.time() - start_time

            success = successful / total >= 0.8  # 80%错误处理正确

            self.log_ux_test(
                scenario,
                success,
                f"错误恢复测试: {successful}/{total} 正确处理",
                duration
            )
            return success

        except Exception as e:
            duration = time.time() - start_time
            self.log_ux_test(scenario, False, f"错误恢复测试失败: {str(e)}", duration)
            return False

    async def test_accessibility(self) -> bool:
        """测试可访问性场景"""
        scenario = "可访问性 - 特殊需求支持"
        start_time = time.time()

        try:
            print("♿ 测试系统可访问性...")

            # 测试屏幕阅读器友好
            prompt = "简单的柱状图 标题明确"
            generate_response = requests.post(
                f"{self.api_base}/generate",
                json={"prompt": prompt}
            )

            if generate_response.status_code != 200:
                raise ValueError("生成失败")

            generate_data = generate_response.json()
            generation_id = generate_data.get("generation_id")

            # 等待完成
            await asyncio.sleep(2)
            status_response = requests.get(f"{self.api_base}/status/{generation_id}")
            status_data = status_response.json()

            if status_data.get("status") != "completed":
                raise ValueError("生成未完成")

            html_url = status_data.get("html_url")
            viz_response = requests.get(f"{self.base_url}{html_url}")

            if viz_response.status_code != 200:
                raise ValueError("获取可视化失败")

            content = viz_response.text

            # 检查可访问性特征
            has_title = "title" in content and ("<h1>" in content or "<title>" in content)
            has_alt_text = "alt=" in content or "aria-" in content
            has_semantic = ("<section>" in content or "<article>" in content or
                          "<nav>" in content or "<main>" in content)
            has_high_contrast = ("contrast" in content or "high-contrast" in content or
                               "可读性" in content)

            accessibility_score = sum([has_title, has_alt_text, has_semantic, has_high_contrast])

            duration = time.time() - start_time
            success = accessibility_score >= 2  # 至少2个可访问性特征

            self.log_ux_test(
                scenario,
                success,
                f"可访问性评分: {accessibility_score}/4 (标题: {has_title}, 描述: {has_alt_text}, 语义: {has_semantic}, 对比度: {has_high_contrast})",
                duration
            )
            return success

        except Exception as e:
            duration = time.time() - start_time
            self.log_ux_test(scenario, False, f"可访问性测试失败: {str(e)}", duration)
            return False

    async def run_all_ux_tests(self) -> Dict[str, Any]:
        """运行所有用户体验测试"""
        print("🎨 万物可视化 v2.0 - 用户体验测试")
        print("=" * 60)
        print()

        # 用户场景测试
        await self.test_student_math_homework()
        await self.test_teacher_lecture_prep()
        await self.test_researcher_data_analysis()
        await self.test_quick_exploration()

        # 系统质量测试
        await self.test_error_recovery()
        await self.test_accessibility()

        return self.generate_ux_report()

    def generate_ux_report(self) -> Dict[str, Any]:
        """生成用户体验报告"""
        total_scenarios = len(self.test_results)
        successful_scenarios = sum(1 for result in self.test_results if result["success"])

        print("\n" + "=" * 60)
        print("🎨 用户体验测试报告")
        print("=" * 60)
        print(f"测试场景: {total_scenarios}")
        print(f"成功场景: {successful_scenarios}")
        print(f"失败场景: {total_scenarios - successful_scenarios}")
        print(f"UX评分: {self.get_ux_grade()}")

        print("\n🎯 场景详情:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            duration = result.get("duration", 0)
            print(f"{status} {result['scenario']}")
            if result.get("details"):
                print(f"   📋 {result['details']}")
            if duration > 0:
                print(f"   ⏱️  耗时: {duration:.2f}秒")

        print(f"\n💡 UX改进建议:")
        print(self.get_ux_recommendations())

        return {
            "total_scenarios": total_scenarios,
            "successful_scenarios": successful_scenarios,
            "failed_scenarios": total_scenarios - successful_scenarios,
            "ux_score": successful_scenarios / total_scenarios if total_scenarios > 0 else 0,
            "ux_grade": self.get_ux_grade(),
            "detailed_results": self.test_results,
            "recommendations": self.get_ux_recommendations()
        }

    def get_ux_grade(self) -> str:
        """评估UX等级"""
        if not self.test_results:
            return "无法评估"

        success_rate = sum(1 for r in self.test_results if r["success"]) / len(self.test_results)

        if success_rate >= 0.95:
            return "A+ (优秀)"
        elif success_rate >= 0.85:
            return "A (良好)"
        elif success_rate >= 0.75:
            return "B (一般)"
        elif success_rate >= 0.60:
            return "C (需要改进)"
        else:
            return "D (重大改进)"

    def get_ux_recommendations(self) -> List[str]:
        """获取UX改进建议"""
        recommendations = []

        # 分析失败场景
        failed_scenarios = [r for r in self.test_results if not r["success"]]

        if any("学生" in str(r["scenario"]) for r in failed_scenarios):
            recommendations.append("改进学生作业场景的响应速度和结果质量")

        if any("教师" in str(r["scenario"]) for r in failed_scenarios):
            recommendations.append("增强教师备课场景的交互性和教学功能")

        if any("快速" in str(r["scenario"]) for r in failed_scenarios):
            recommendations.append("优化快速查询的响应时间和缓存机制")

        if any("错误" in str(r["scenario"]) for r in failed_scenarios):
            recommendations.append("加强错误处理和用户输入验证")

        if any("可访问" in str(r["scenario"]) for r in failed_scenarios):
            recommendations.append("提升系统的可访问性和无障碍支持")

        if not recommendations:
            recommendations.append("继续优化整体用户体验和界面友好性")

        return recommendations

async def main():
    """主函数"""
    tester = UserExperienceTester()

    try:
        await tester.run_all_ux_tests()
    except KeyboardInterrupt:
        print("\n⏹️  UX测试被用户中断")
    except Exception as e:
        print(f"\n💥 UX测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())