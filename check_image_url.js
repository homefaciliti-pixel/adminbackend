const https = require('https');

const imageFilename = '1773040754_AC.jfif'; // From the Standard Jet Wash or similar service

const bases = [
  `https://www.homefaciliti.com/uploads/${imageFilename}`,
  `https://www.homefaciliti.com/storage/${imageFilename}`,
  `https://www.homefaciliti.com/images/${imageFilename}`,
  `https://www.homefaciliti.com/public/uploads/${imageFilename}`,
  `https://www.homefaciliti.com/uploads/images/${imageFilename}`,
  `https://www.homefaciliti.com/${imageFilename}`
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD' }, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, status: 'error', message: err.message });
    }).end();
  });
}

async function run() {
  console.log(`Checking potential paths for image: ${imageFilename}...`);
  for (const url of bases) {
    const res = await checkUrl(url);
    console.log(`URL: ${res.url} -> Status: ${res.status}`);
  }
  process.exit(0);
}

run();
