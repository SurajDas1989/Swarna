const sizeOf = require('image-size');
const path = require('path');
const imgPath = path.join(__dirname, 'public', 'hero-banner.png');
try {
    const dimensions = sizeOf(imgPath);
    console.log(`Width: ${dimensions.width} Height: ${dimensions.height}`);
} catch (err) {
    console.error(err);
}
