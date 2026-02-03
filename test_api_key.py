#!/usr/bin/env python3
"""
API密钥快速测试脚本
运行方式: python3 test_api_key.py
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from custom_llm_config import LLMConfig, LLMProvider

# 测试配置
TEST_CONFIGS = {
    "gemini": {
        "provider": LLMProvider.GOOGLE,
        "model": "gemini-1.5-flash",
        "base_url": "https://generativelanguage.googleapis.com",
        "key_prompt": "请输入你的 Gemini API Key (AIzaSy...): "
    },
    "openai": {
        "provider": LLMProvider.OPENAI,
        "model": "gpt-4o-mini",
        "base_url": "https://api.openai.com/v1",
        "key_prompt": "请输入你的 OpenAI API Key (sk-...): "
    },
    "glm": {
        "provider": LLMProvider.GLM,
        "model": "glm-4-air",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "key_prompt": "请输入你的 智谱GLM API Key: "
    },
    "deepseek": {
        "provider": LLMProvider.DEEPSEEK,
        "model": "deepseek-chat",
        "base_url": "https://api.deepseek.com",
        "key_prompt": "请输入你的 DeepSeek API Key (sk-...): "
    }
}

def print_banner():
    """打印欢迎横幅"""
    print("\n" + "="*60)
    print("🔑 万物可视化 - API密钥测试工具")
    print("="*60 + "\n")

def print_menu():
    """打印菜单"""
    print("请选择要测试的AI模型:")
    print("  1. Google Gemini 1.5 Flash (推荐 - 有免费额度)")
    print("  2. OpenAI GPT-4o Mini")
    print("  3. 智谱GLM-4 Air (国产)")
    print("  4. DeepSeek Chat (高性价比)")
    print("  5. 测试所有配置的模型")
    print("  0. 退出")
    print()

async def test_model(provider_name: str, api_key: str):
    """测试单个模型"""
    print(f"\n{'='*60}")
    print(f"🧪 测试 {provider_name.upper()} 模型")
    print(f"{'='*60}\n")

    config = TEST_CONFIGS[provider_name]

    try:
        # 创建LLM配置
        llm_config = LLMConfig(
            provider=config["provider"],
            model_name=config["model"],
            api_key=api_key,
            base_url=config["base_url"],
            timeout=30  # 30秒超时
        )

        # 导入客户端（这里简化处理）
        from custom_llm_config import GoogleGenAIClient, OpenAIClient

        # 根据提供商创建客户端
        if config["provider"] == LLMProvider.GOOGLE:
            client = GoogleGenAIClient(llm_config)
        elif config["provider"] == LLMProvider.OPENAI:
            client = OpenAIClient(llm_config)
        else:
            print(f"⚠️  暂不支持测试 {provider_name}，请手动测试")
            return False

        # 测试生成
        print("⏳ 发送测试请求...")
        test_prompt = "你好，请用一句话简单介绍一下你自己"

        response = await client.generate_response(test_prompt)

        if response and response != False:
            print(f"✅ 成功! 模型响应:")
            print(f"   {response[:100]}{'...' if len(response) > 100 else ''}\n")
            return True
        else:
            print(f"❌ 失败! 未收到有效响应\n")
            return False

    except Exception as e:
        print(f"❌ 错误: {str(e)}\n")
        return False

async def test_all_configured():
    """测试所有已配置的模型"""
    print("\n🔍 检查配置文件...\n")

    # 读取配置文件
    from custom_llm_config import LLM_CONFIGURATIONS

    if not LLM_CONFIGURATIONS:
        print("⚠️  未找到任何配置的模型")
        print("   请在 custom_llm_config.py 的 LLM_CONFIGURATIONS 中添加模型配置")
        return

    print(f"✅ 找到 {len(LLM_CONFIGURATIONS)} 个配置的模型:\n")

    success_count = 0
    for name, config in LLM_CONFIGURATIONS.items():
        print(f"📋 {name}")
        print(f"   Provider: {config.provider.value}")
        print(f"   Model: {config.model_name}")

        if not config.api_key or config.api_key.startswith("your-"):
            print(f"   ⚠️  API密钥未配置 (跳过测试)\n")
            continue

        # 测试该模型
        success = await test_model(name, config.api_key)
        if success:
            success_count += 1

    print(f"\n{'='*60}")
    print(f"📊 测试结果: {success_count}/{len(LLM_CONFIGURATIONS)} 个模型可用")
    print(f"{'='*60}\n")

def main():
    """主函数"""
    print_banner()

    while True:
        print_menu()
        choice = input("请输入选项 (0-5): ").strip()

        if choice == "0":
            print("\n👋 再见!")
            break
        elif choice == "1":
            api_key = input(TEST_CONFIGS["gemini"]["key_prompt"]).strip()
            if api_key:
                asyncio.run(test_model("gemini", api_key))
        elif choice == "2":
            api_key = input(TEST_CONFIGS["openai"]["key_prompt"]).strip()
            if api_key:
                asyncio.run(test_model("openai", api_key))
        elif choice == "3":
            api_key = input(TEST_CONFIGS["glm"]["key_prompt"]).strip()
            if api_key:
                print("\n⚠️  智谱GLM测试需要完整的客户端实现")
                print("   请使用选项5测试配置文件中的模型")
        elif choice == "4":
            api_key = input(TEST_CONFIGS["deepseek"]["key_prompt"]).strip()
            if api_key:
                print("\n⚠️  DeepSeek测试需要完整的客户端实现")
                print("   请使用选项5测试配置文件中的模型")
        elif choice == "5":
            asyncio.run(test_all_configured())
        else:
            print("\n⚠️  无效选项，请重新选择\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 测试已取消")
    except Exception as e:
        print(f"\n❌ 发生错误: {str(e)}")
