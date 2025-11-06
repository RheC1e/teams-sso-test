#!/bin/bash

# 簡單的圖示建立腳本（使用 ImageMagick 或 sips）

echo "建立 Teams 應用程式圖示..."

# 檢查是否有 ImageMagick
if command -v convert &> /dev/null; then
    echo "使用 ImageMagick 建立圖示..."
    
    # Color Icon (192x192)
    convert -size 192x192 xc:'#6366f1' \
            -font Arial-Bold -pointsize 120 -fill white \
            -gravity center -annotate +0+0 'R' \
            icon-color.png
    
    # Outline Icon (32x32)
    convert -size 32x32 xc:white \
            -font Arial-Bold -pointsize 20 -fill '#6366f1' \
            -gravity center -annotate +0+0 'R' \
            icon-outline.png
    
    echo "✅ 圖示已建立"
    
# 檢查是否有 sips (macOS)
elif command -v sips &> /dev/null; then
    echo "使用 sips 建立圖示（需要先建立基礎圖片）..."
    echo "⚠️  建議使用線上工具或 Python 腳本"
    
# 否則提供替代方案
else
    echo "❌ 未找到 ImageMagick 或 sips"
    echo ""
    echo "替代方案："
    echo "1. 使用線上工具：https://www.favicon-generator.org/"
    echo "2. 使用 Python + Pillow：pip3 install Pillow"
    echo "3. 使用 create-icons.html 在瀏覽器中產生"
fi

