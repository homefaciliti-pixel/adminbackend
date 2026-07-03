try {
  const { Jimp } = require('jimp');
  console.log('Jimp class/object loaded:', typeof Jimp);
  console.log('Jimp keys:', Object.keys(Jimp));
  if (Jimp.read) {
    console.log('Jimp.read is available!');
  } else {
    console.log('Jimp.read is NOT available!');
  }
  process.exit(0);
} catch (err) {
  console.error('Failed to load Jimp:', err);
  process.exit(1);
}
