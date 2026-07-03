const http = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, statusCode: 500, error: err.message });
    });
  });
}

async function run() {
  const url1 = 'https://adminbackend-1-h03r.onrender.com/uploads/1781679134471_scaled_AC_Foam_Jet_Service.png';
  const url2 = 'https://adminbackend-1-h03r.onrender.com/uploads/banners/1781679134471_scaled_AC_Foam_Jet_Service.png';

  const res1 = await checkUrl(url1);
  const res2 = await checkUrl(url2);

  console.log('Test 1 (without /banners/):', res1);
  console.log('Test 2 (with /banners/):', res2);
}

run();
