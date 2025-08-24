#!/usr/bin/env python3
"""
Simple script to create basic PWA icons for ScoreLeague
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Create image with gradient-like background
    img = Image.new('RGB', (size, size), '#3498db')
    draw = ImageDraw.Draw(img)
    
    # Add darker border
    draw.rectangle([0, 0, size-1, size-1], outline='#2c3e50', width=max(1, size//50))
    
    # Try to use a font, fallback to default if not available
    try:
        font_size = size // 4
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw "SL" text
    text = "SL"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    
    # Save icon
    icon_path = f'icons/icon-{size}x{size}.png'
    img.save(icon_path, 'PNG')
    print(f"Created {icon_path}")

# Create icons directory
os.makedirs('icons', exist_ok=True)

# Create all required icon sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for size in sizes:
    create_icon(size)

print("✅ All PWA icons created successfully!")
