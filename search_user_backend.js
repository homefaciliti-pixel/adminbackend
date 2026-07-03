const fs = require('fs');
const path = require('path');

function run() {
  const filePath = 'd:/userapp/backend/server.js';
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`Searching for "banner1" in ${filePath}...`);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('banner1') || lines[i].includes('staticBanners') || lines[i].includes('ac_services_banner')) {
      console.log(`\nLine ${i + 1}: ${lines[i].trim()}`);
      // Print context (5 lines before and after)
      const start = Math.max(0, i - 10);
      const end = Math.min(lines.length, i + 15);
      console.log('--- Context ---');
      for (let j = start; j < end; j++) {
        console.log(`${j + 1}: ${lines[j]}`);
      }
      console.log('---------------');
    }
  }
}

run();
