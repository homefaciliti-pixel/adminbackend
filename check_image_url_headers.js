const https = require('https');

const imageFilename = '1773040754_AC.jfif';

const bases = [
  `https://www.homefaciliti.com/uploads/${imageFilename}`,
  `https://www.homefaciliti.com/storage/${imageFilename}`,
  `https://www.homefaciliti.com/images/${imageFilename}`,
  `https://www.homefaciliti.com/public/uploads/${imageFilename}`,
  `https://www.homefaciliti.com/uploads/images/${imageFilename}`,
  `https://www.homefaciliti.com/${imageFilename}`
];

function checkUrlHeaders(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'GET' }, (res) => {
      resolve({ url, status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => {
      resolve({ url, status: 'error', message: err.message });
    }).end();
  });
}

async function run() {
  console.log(`Checking content-type headers for image: ${imageFilename}...`);
  for (const url of bases) {
    const res = await checkUrlHeaders(url);
    console.log(`URL: ${res.url} -> Status: ${res.status}, Content-Type: ${res.contentType}`);
  }
  process.exit(0);
}

run();
