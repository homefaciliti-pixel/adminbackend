async function run() {
  const url = 'https://backend-1-ux3b.onrender.com/';
  console.log(`Checking: ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body:`, text.substring(0, 1000));
  } catch (err) {
    console.error(err);
  }
}
run();
