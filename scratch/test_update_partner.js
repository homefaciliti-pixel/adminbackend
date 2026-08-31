async function test() {
  const baseUrl = 'https://adminbackend-1-h03r.onrender.com/api';
  const laravelId = 10002296;

  const res = await fetch(`${baseUrl}/partners/${laravelId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isApproved: true, status: true })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.json());
}

test();
