const fs = require('fs');
const path = require('path');

function run() {
  const srcDir = path.join(__dirname, 'uploads/banners');
  const destDir = path.join(__dirname, 'uploads');

  if (!fs.existsSync(srcDir)) {
    console.log(`Source directory does not exist: ${srcDir}`);
    process.exit(0);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    const files = fs.readdirSync(srcDir);
    console.log(`Found ${files.length} banner files in ${srcDir}`);

    let copiedCount = 0;
    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);

      // Only copy files (not directories)
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      }
    }
    console.log(`Successfully copied ${copiedCount} files to ${destDir}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to copy files:', err);
    process.exit(1);
  }
}

run();
