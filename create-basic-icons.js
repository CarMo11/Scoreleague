// Simple Node.js script to create basic PWA icons
const fs = require('fs');

// Create a simple base64 encoded PNG for each size
function createBasicIcon(size) {
    // This is a minimal 1x1 blue PNG in base64, we'll use it as placeholder
    const bluePixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRWkOAAAAABJRU5ErkJggg==';
    
    // For testing, we'll create a simple colored square
    // In a real scenario, you'd use a proper image library
    const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3498db"/>
                <stop offset="100%" style="stop-color:#2c3e50"/>
            </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#bg)" stroke="#2c3e50" stroke-width="2"/>
        <text x="${size/2}" y="${size/2 + size/8}" font-family="Arial" font-size="${size/4}" font-weight="bold" text-anchor="middle" fill="white">SL</text>
        <text x="${size/2}" y="${size * 0.8}" font-family="Arial" font-size="${size/12}" text-anchor="middle" fill="white">ScoreLeague</text>
        <circle cx="${size/2}" cy="${size/4}" r="${size/8}" fill="white" stroke="#2c3e50" stroke-width="1"/>
    </svg>`;
    
    return canvas;
}

// Create all required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
    const svgContent = createBasicIcon(size);
    fs.writeFileSync(`icons/icon-${size}x${size}.svg`, svgContent);
    console.log(`Created icon-${size}x${size}.svg`);
});

console.log('✅ Basic SVG icons created for PWA testing!');
