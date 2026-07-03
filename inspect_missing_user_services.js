const http = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

const missingTitles = [
  'Leakage Repair',
  'Kitchen Cleaning',
  'Hair Cut',
  'Hair Coloring',
  'Furniture Repair',
  'Consultation'
];

async function run() {
  try {
    const userAppRes = await fetchUrl('https://backend-1-ux3b.onrender.com/api/services');
    const userAppServices = userAppRes.services || [];

    for (const title of missingTitles) {
      console.log(`\n=== CUSTOMER APP SERVICES MATCHING "${title}": ===`);
      const matches = userAppServices.filter(s => s.title.toLowerCase().includes(title.toLowerCase()));
      console.log(matches);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
