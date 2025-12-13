#!/usr/bin/env python3
"""
数据库初始化脚本
专为数据库小白设计的简单配置
"""

import sqlite3
import os
from datetime import datetime

# 数据库文件路径（在你的项目中）
DB_PATH = "data/visualization_cache.db"

def create_database():
    """创建数据库和表 - 一键搞定！"""

    # 确保data目录存在
    os.makedirs("data", exist_ok=True)

    # 连接数据库（如果不存在会自动创建）
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("🔧 正在创建数据库表...")

    # 创建可视化记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visualization_records (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            keywords TEXT,
            subject TEXT,
            html_content TEXT,
            generation_source TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            usage_count INTEGER DEFAULT 0
        )
    ''')

    # 创建关键词索引表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS keyword_index (
            keyword TEXT PRIMARY KEY,
            subject TEXT,
            usage_count INTEGER DEFAULT 1,
            last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 创建文件上传表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_type TEXT,
            file_size INTEGER,
            extracted_content TEXT,
            processing_status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 创建索引（让查询更快）
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_keywords ON visualization_records(keywords)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_subject ON visualization_records(subject)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_created_at ON visualization_records(created_at)')

    # 提交更改
    conn.commit()
    conn.close()

    print(f"✅ 数据库创建成功！")
    print(f"📍 数据库位置: {os.path.abspath(DB_PATH)}")
    print(f"💾 文件大小: {os.path.getsize(DB_PATH)} 字节")

def test_database():
    """测试数据库是否正常工作"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 插入测试数据
    test_data = {
        'id': 'test_001',
        'prompt': '正弦波图像',
        'keywords': '正弦波,三角函数,数学',
        'subject': 'mathematics',
        'html_content': '<html><body><h1>正弦波</h1></body></html>',
        'generation_source': 'mock'
    }

    cursor.execute('''
        INSERT INTO visualization_records
        (id, prompt, keywords, subject, html_content, generation_source)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        test_data['id'], test_data['prompt'], test_data['keywords'],
        test_data['subject'], test_data['html_content'], test_data['generation_source']
    ))

    # 查询测试
    cursor.execute('SELECT * FROM visualization_records WHERE id = ?', (test_data['id'],))
    result = cursor.fetchone()

    conn.commit()
    conn.close()

    if result:
        print("🎉 数据库测试成功！")
        print(f"📝 测试数据已插入: {result[1]}")  # prompt
        return True
    else:
        print("❌ 数据库测试失败！")
        return False

if __name__ == "__main__":
    print("🚀 开始初始化数据库...")

    try:
        create_database()

        if test_database():
            print("\n🎊 恭喜！数据库设置完成！")
            print("\n📖 接下来你可以：")
            print("1. 在Python中导入这个数据库")
            print("2. 开始存储和查询可视化记录")
            print("3. 查看data/visualization_cache.db文件")
        else:
            print("❌ 请检查数据库设置")

    except Exception as e:
        print(f"❌ 错误: {e}")
        print("💡 解决方案：")
        print("1. 确保你有写入权限")
        print("2. 检查Python sqlite3模块是否安装")