#!/bin/bash

# 万物可视化 v2.0 API 测试脚本
BASE_URL="http://localhost:9999/api/v2"

echo "🧪 万物可视化 v2.0 API 测试"
echo "================================"

# 1. 测试API根端点
echo "1. 测试API根端点..."
curl -s $BASE_URL/../ | jq .

echo -e "\n2. 测试获取所有模板..."
curl -s "$BASE_URL/templates" | jq '.total, .subjects'

echo -e "\n3. 测试模板搜索..."
curl -s "$BASE_URL/templates/search?query=正态分布" | jq '.total, .templates[0].name'

echo -e "\n4. 测试学科分类..."
curl -s -X POST "$BASE_URL/classify" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "太阳系行星轨道运动"}' | jq .

echo -e "\n5. 开始生成可视化..."
GENERATION_RESPONSE=$(curl -s -X POST "$BASE_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "正态分布 均值2 标准差1.5"}')

echo $GENERATION_RESPONSE | jq .

# 提取generation_id
GENERATION_ID=$(echo $GENERATION_RESPONSE | jq -r '.generation_id')

if [ "$GENERATION_ID" != "null" ] && [ "$GENERATION_ID" != "" ]; then
    echo -e "\n6. 查询生成状态..."
    sleep 1  # 等待1秒让后端处理

    STATUS_RESPONSE=$(curl -s "$BASE_URL/status/$GENERATION_ID")
    echo $STATUS_RESPONSE | jq '.status, .progress, .html_url'

    # 如果生成完成，测试获取可视化结果
    HTML_URL=$(echo $STATUS_RESPONSE | jq -r '.html_url')
    if [ "$HTML_URL" != "null" ] && [ "$HTML_URL" != "" ]; then
        echo -e "\n7. 获取可视化结果..."
        curl -s -I "http://localhost:9999$HTML_URL" | head -1
    fi
else
    echo "❌ 生成请求失败"
fi

echo -e "\n✅ API测试完成！"