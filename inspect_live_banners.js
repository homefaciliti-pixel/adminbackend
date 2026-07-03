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

async function run() {
  const res = await fetchUrl('https://backend-1-ux3b.onrender.com/api/banners');
  console.log('--- FULL USER APP BANNERS: ---');
  console.log(JSON.stringify(res, null, 2));
}

run();
