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
  const url = 'https://adminbackend-1-h03r.onrender.com/api/services';
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetchUrl(url);
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200 && res.body.data) {
      console.log('Total services returned by admin backend:', res.body.data.length);
      console.log('First service in admin backend:', res.body.data[0]);
    } else {
      console.log('Body:', res.body);
    }
  } catch (err) {
    console.error(`Failed: ${err.message}`);
  }
}

run();
