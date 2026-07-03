const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const image = new Jimp({ width: 800, height: 600, color: 0xff0000ff });
    const tempFile = path.join(__dirname, 'test_temp.png');
    await image.write(tempFile);

    const img = await Jimp.read(tempFile);
    console.log('Testing old crop signature (x, y, w, h):');
    
    // Test if older signature works
    await img.crop(0, 75, 800, 450);
    await img.write(tempFile);
    
    console.log('Old signature worked!');
    fs.unlinkSync(tempFile);
    process.exit(0);
  } catch (err) {
    console.error('Old signature failed:', err.message);
    process.exit(1);
  }
}

test();
