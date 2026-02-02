#!/bin/bash
# 项目文件整理脚本
# 将零散文件按类型分类到对应的文件夹中

set -e  # 遇到错误立即退出

echo "🗂️  开始整理项目文件..."
echo ""

# 创建目标文件夹
echo "📁 创建分类文件夹..."
mkdir -p scripts/python
mkdir -p scripts/shell
mkdir -p tests/frontend
mkdir -p docs/guides
mkdir -p docs/reports
mkdir -p docs/api
mkdir -p config
mkdir -p screenshots
mkdir -p archive/zip
mkdir -p archive/old

# 1. 移动 Python 脚本
echo "📜 整理 Python 脚本..."
mv batch_generate_chapter1.py scripts/python/ 2>/dev/null || true
mv check_keys.py scripts/python/ 2>/dev/null || true
mv check_pages.py scripts/python/ 2>/dev/null || true
mv custom_llm_config.py scripts/python/ 2>/dev/null || true
mv demo_pdf_splitting.py scripts/python/ 2>/dev/null || true
mv demo_textbook_agent.py scripts/python/ 2>/dev/null || true
mv demo_textbook_simple.py scripts/python/ 2>/dev/null || true
mv demo_two_skills_workflow.py scripts/python/ 2>/dev/null || true
mv ellipsoid_3d.py scripts/python/ 2>/dev/null || true
mv ellipsoid_simple.py scripts/python/ 2>/dev/null || true
mv ellipsoid_variations.py scripts/python/ 2>/dev/null || true
mv extract_toc_ocr.py scripts/python/ 2>/dev/null || true
mv extract_toc_simple.py scripts/python/ 2>/dev/null || true
mv generate_accurate_chapters.py scripts/python/ 2>/dev/null || true
mv inspect_toc.py scripts/python/ 2>/dev/null || true
mv manual_chapters.py scripts/python/ 2>/dev/null || true
mv use_mineru_correctly.py scripts/python/ 2>/dev/null || true
mv user_experience_test.py scripts/python/ 2>/dev/null || true
mv validate_keys.py scripts/python/ 2>/dev/null || true
mv verify_accurate_pages.py scripts/python/ 2>/dev/null || true
mv verify_pages.py scripts/python/ 2>/dev/null || true

# 2. 移动 Shell 脚本
echo "🐚 整理 Shell 脚本..."
mv campus_deploy.sh scripts/shell/ 2>/dev/null || true
mv check-servers.sh scripts/shell/ 2>/dev/null || true
mv deploy_linux.sh scripts/shell/ 2>/dev/null || true
mv deploy_to_linux.sh scripts/shell/ 2>/dev/null || true
mv export_pdf_custom_columns.sh scripts/shell/ 2>/dev/null || true
mv export_pdf_large_font.sh scripts/shell/ 2>/dev/null || true
mv export_pdf_precise_columns.sh scripts/shell/ 2>/dev/null || true
mv fix_dependencies.sh scripts/shell/ 2>/dev/null || true
mv install_docker_macos.sh scripts/shell/ 2>/dev/null || true
mv install_manim.sh scripts/shell/ 2>/dev/null || true
mv uninstall_mineru_mac.sh scripts/shell/ 2>/dev/null || true

# 3. 移动 HTML 测试文件
echo "🌐 整理 HTML 测试文件..."
mv basic-test.html tests/frontend/ 2>/dev/null || true
mv browser_compatibility_test.html tests/frontend/ 2>/dev/null || true
mv button-test.html tests/frontend/ 2>/dev/null || true
mv comprehensive-test-suite.html tests/frontend/ 2>/dev/null || true
mv custom-viz-demo.html tests/frontend/ 2>/dev/null || true
mv debug-frontend-v2.html tests/frontend/ 2>/dev/null || true
mv debug-main-app.html tests/frontend/ 2>/dev/null || true
mv debug-test.html tests/frontend/ 2>/dev/null || true
mv debug-visualization.html tests/frontend/ 2>/dev/null || true
mv dna_double_helix.html tests/frontend/ 2>/dev/null || true
mv ellipsoid_3d.html tests/frontend/ 2>/dev/null || true
mv ellipsoid_css_3d.html tests/frontend/ 2>/dev/null || true
mv main-app-fixed.html tests/frontend/ 2>/dev/null || true
mv main-app-test.html tests/frontend/ 2>/dev/null || true
mv visualization-test.html tests/frontend/ 2>/dev/null || true

# 4. 移动 JavaScript 文件
echo "📜 整理 JavaScript 文件..."
mv fix-generate-button.js tests/frontend/ 2>/dev/null || true

# 5. 移动文档文件 - 指南类
echo "📖 整理文档 - 指南类..."
mv AGENTS.md docs/guides/ 2>/dev/null || true
mv AI_COST_GUIDE.md docs/guides/ 2>/dev/null || true
mv DOCKER_INSTALL_GUIDE.md docs/guides/ 2>/dev/null || true
mv DOCKER_RESOURCES.md docs/guides/ 2>/dev/null || true
mv GEMINI_3_PRO_Guide.md docs/guides/ 2>/dev/null || true
mv GLM_QUICKSTART.md docs/guides/ 2>/dev/null || true
mv HTTP服务器使用指南.md docs/guides/ 2>/dev/null || true
mv LINUX_DEPLOYMENT_GUIDE.md docs/guides/ 2>/dev/null || true
mv MATHEMATICS_VISUALIZATION_GUIDE.md docs/guides/ 2>/dev/null || true
mv V2-README-快速启动.md docs/guides/ 2>/dev/null || true
mv VS_CODE_REMOTE_SSH_GUIDE.md docs/guides/ 2>/dev/null || true
mv 离线版模块转换为在线版完成报告.md docs/guides/ 2>/dev/null || true
mv 在线版测试报告.md docs/guides/ 2>/dev/null || true
mv 在线版快速参考.md docs/guides/ 2>/dev/null || true
mv 在线版融合完成报告.md docs/guides/ 2>/dev/null || true
mv 在线版完成报告.md docs/guides/ 2>/dev/null || true

# 6. 移动文档文件 - 报告类
echo "📊 整理文档 - 报告类..."
mv CSDN版本对比报告.md docs/reports/ 2>/dev/null || true
mv DeepSeek-Manim整合方案.md docs/reports/ 2>/dev/null || true
mv DeepSeek-vs-GLM对比分析.md docs/reports/ 2>/dev/null || true
mv GLM_4.6_最终测试报告.md docs/reports/ 2>/dev/null || true
mv GLM_TEST_REPORT.md docs/reports/ 2>/dev/null || true
mv 代码来源说明.md docs/reports/ 2>/dev/null || true
mv 动画来源清晰说明.md docs/reports/ 2>/dev/null || true
mv 竞品分析-DeepTutor与GoogleDynamicView-20250117.md docs/reports/ 2>/dev/null || true
mv 万物可视化测试报告.md docs/reports/ 2>/dev/null || true
mv 完美版改进说明.md docs/reports/ 2>/dev/null || true
mv 万物可视化-差异化功能设计-20250117.md docs/reports/ 2>/dev/null || true
mv 问题修复说明.md docs/reports/ 2>/dev/null || true
mv 项目分析20251126.md docs/reports/ 2>/dev/null || true
mv 三个版本完整对比.md docs/reports/ 2>/dev/null || true
mv 主页可视化修复说明.md docs/reports/ 2>/dev/null || true

# 7. 移动文档文件 - API 类
echo "🔌 整理文档 - API 类..."
mv API测试详细指南.md docs/api/ 2>/dev/null || true
mv API端点实际顺序列表.md docs/api/ 2>/dev/null || true
mv 实际API端点对照表.md docs/api/ 2>/dev/null || true
mv 正确的API端点列表.md docs/api/ 2>/dev/null || true

# 8. 移动文档文件 - 其他
echo "📝 整理其他文档..."
mv IMPLEMENTATION_DETAILS.md docs/ 2>/dev/null || true
mv ISSUES_AND_SOLUTIONS.md docs/ 2>/dev/null || true
mv SKILLS_USAGE_README.md docs/ 2>/dev/null || true
mv WEB_APP_COMPLETE.md docs/ 2>/dev/null || true
mv WEB_APP_GUIDE.md docs/ 2>/dev/null || true
mv 万物可视化进展及下一步规划+20251201.md docs/ 2>/dev/null || true
mv 万物可视化执行清单20251207.md docs/ 2>/dev/null || true
mv 项目整理方案.md docs/ 2>/dev/null || true
mv 可视化任务流程.md docs/ 2>/dev/null || true
mv 可视化日常测试.md docs/ 2>/dev/null || true
mv 灵活大模型集成指南.md docs/ 2>/dev/null || true
mv 执行清单与竞品对标分析-20250117.md docs/ 2>/dev/null || true
mv 三个主页的差别与测试策略.md docs/ 2>/dev/null || true
mv v2版本的技术架构.md docs/ 2>/dev/null || true

# 9. 移动截图
echo "📸 整理截图文件..."
mv 截屏*.png screenshots/ 2>/dev/null || true

# 10. 移动压缩包和旧文件
echo "📦 整理压缩包和旧文件..."
mv DeepTutor-main.zip archive/zip/ 2>/dev/null || true

# 11. 移动环境配置
echo "⚙️  整理配置文件..."
# .env 和 .env.example 保留在根目录

echo ""
echo "✅ 文件整理完成！"
echo ""
echo "📊 整理结果："
echo "  📜 Python 脚本 → scripts/python/"
echo "  🐚 Shell 脚本 → scripts/shell/"
echo "  🌐 HTML 测试 → tests/frontend/"
echo "  📖 文档指南 → docs/guides/"
echo "  📊 文档报告 → docs/reports/"
echo "  🔌 API 文档 → docs/api/"
echo "  📸 截图 → screenshots/"
echo "  📦 压缩包 → archive/zip/"
echo ""
echo "⚠️  请检查整理结果，确认文件移动正确！"
