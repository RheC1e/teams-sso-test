#!/usr/bin/env python3
"""
建立 Teams 應用程式圖示
需要安裝 Pillow: pip3 install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("❌ 需要安裝 Pillow")
    print("請執行: pip3 install Pillow")
    exit(1)

def create_color_icon():
    """建立 Color Icon (192x192)"""
    img = Image.new('RGB', (192, 192), color='#6366f1')
    draw = ImageDraw.Draw(img)
    
    # 繪製漸層背景
    for i in range(192):
        r = int(99 + (139 - 99) * i / 192)
        g = int(102 + (92 - 102) * i / 192)
        b = int(241 + (246 - 241) * i / 192)
        draw.rectangle([(0, i), (192, i+1)], fill=(r, g, b))
    
    # 繪製白色 R
    try:
        # 嘗試使用系統字體
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 120)
    except:
        try:
            font = ImageFont.truetype('/System/Library/Fonts/Arial.ttf', 120)
        except:
            font = ImageFont.load_default()
    
    draw.text((96, 96), 'R', fill='white', font=font, anchor='mm')
    img.save('icon-color.png')
    print('✅ icon-color.png 已建立 (192x192)')

def create_outline_icon():
    """建立 Outline Icon (32x32)"""
    img = Image.new('RGB', (32, 32), color='white')
    draw = ImageDraw.Draw(img)
    
    # 繪製紫色 R
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 20)
    except:
        try:
            font = ImageFont.truetype('/System/Library/Fonts/Arial.ttf', 20)
        except:
            font = ImageFont.load_default()
    
    draw.text((16, 16), 'R', fill='#6366f1', font=font, anchor='mm')
    img.save('icon-outline.png')
    print('✅ icon-outline.png 已建立 (32x32)')

if __name__ == '__main__':
    print('開始建立 Teams 應用程式圖示...')
    create_color_icon()
    create_outline_icon()
    print('✨ 完成！')
