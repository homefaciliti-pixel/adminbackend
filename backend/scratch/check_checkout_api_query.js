async function run() {
  const url = 'https://backend-1-ux3b.onrender.com/api/checkout-api/9653853414?productId=AC%20Repair';
  console.log(`Checking: ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Body:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
