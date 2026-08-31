async function test() {
  const baseUrl = 'https://adminbackend-1-h03r.onrender.com/api';
  
  // Let's use a local partner: ID 489
  // Let's use a Laravel partner: ID 10002296
  const localId = 489;
  const laravelId = 10002296;

  async function put(url, body) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const status = res.status;
    const text = await res.text();
    try {
      return { status, data: JSON.parse(text) };
    } catch {
      return { status, text };
    }
  }

  console.log('--- Testing Change Password ---');
  try {
    const res = await put(`${baseUrl}/partners/${localId}/password`, { password: 'testpassword123' });
    console.log(`Local Password [${res.status}]:`, res.data || res.text);
  } catch (e) {
    console.error(`Local Password FAIL:`, e.message);
  }

  try {
    const res = await put(`${baseUrl}/partners/${laravelId}/password`, { password: 'testpassword123' });
    console.log(`Laravel Password [${res.status}]:`, res.data || res.text);
  } catch (e) {
    console.error(`Laravel Password FAIL:`, e.message);
  }

  console.log('\n--- Testing Disapprove ---');
  try {
    const res = await put(`${baseUrl}/partners/${localId}/disapprove`);
    console.log(`Local Disapprove [${res.status}]:`, res.data || res.text);
  } catch (e) {
    console.error(`Local Disapprove FAIL:`, e.message);
  }

  try {
    const res = await put(`${baseUrl}/partners/${laravelId}/disapprove`);
    console.log(`Laravel Disapprove [${res.status}]:`, res.data || res.text);
  } catch (e) {
    console.error(`Laravel Disapprove FAIL:`, e.message);
  }

  console.log('\n--- Testing Approve ---');
  try {
    const res = await put(`${baseUrl}/partners/${localId}/approve`);
    console.log(`Local Approve [${res.status}]:`, res.data || res.text);
  } catch (e) {
    console.error(`Local Approve FAIL:`, e.message);
  }

  try {
    const res = await put(`${baseUrl}/partners/${laravelId}/approve`);
    console.log(`Laravel Approve [${res.status}]:`, res.data || res.text);
  } catch (e) {
    console.error(`Laravel Approve FAIL:`, e.message);
  }
}

test();
