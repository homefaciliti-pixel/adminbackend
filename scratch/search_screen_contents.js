const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchDir(filePath, pattern);
    } else if (file.endsWith('.dart')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (pattern.test(content)) {
        console.log(`Found in: ${filePath}`);
        // Print lines containing the match
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching for "Search Name"...');
searchDir('d:\\admin_panel\\lib', /Search Name/i);

console.log('Searching for "Reset"...');
searchDir('d:\\admin_panel\\lib', /Reset/i);

console.log('Searching for "Manage all"...');
searchDir('d:\\admin_panel\\lib', /Manage all/i);
