const http = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const urls = [
    'https://backend-1-ux3b.onrender.com/api/services',
    'https://backend-1-ux3b.onrender.com/api/user/services',
    'https://backend-1-ux3b.onrender.com/api/customer/services',
    'https://backend-1-ux3b.onrender.com/api/categories'
  ];

  for (const url of urls) {
    console.log(`\nFetching: ${url}`);
    try {
      const res = await fetchUrl(url);
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode === 200 && res.body.services) {
        console.log('First Service:', res.body.services[0]);
      } else {
        console.log('Body snippet:', typeof res.body === 'object' ? JSON.stringify(res.body).slice(0, 200) : String(res.body).slice(0, 200));
      }
    } catch (err) {
      console.error(`Failed: ${err.message}`);
    }
  }
}

run();
