import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [
    { size: 192, name: 'pwa-192x192.png' },
    { size: 512, name: 'pwa-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon.png' },
];

async function generateIcons() {
    const svgBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'masked-icon.svg'));

    for (const { size, name } of sizes) {
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(path.join(process.cwd(), 'public', name));
        
        console.log(`Generated ${name}`);
    }

    // Copy favicon.png to favicon.ico (browsers will handle this fine)
    fs.copyFileSync(
        path.join(process.cwd(), 'public', 'favicon.png'),
        path.join(process.cwd(), 'public', 'favicon.ico')
    );
    
    console.log('Generated favicon.ico');
}

generateIcons().catch(console.error); 