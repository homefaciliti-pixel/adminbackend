const server = require('./server');
const http = require('http');

const PORT = 3500;
process.env.PORT = PORT; // override port

// Start server
const app = server.listen(PORT, async () => {
  console.log(`🧪 Test server booted on port ${PORT}`);
  try {
    // Helper to perform GET request
    function fetchJson(url) {
      return new Promise((resolve, reject) => {
        http.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(new Error(`Failed to parse JSON: ${data}`));
            }
          });
        }).on('error', reject);
      });
    }

    // Test 1: Dashboard API
    console.log('Testing GET /api/dashboard...');
    const dashRes = await fetchJson(`http://localhost:${PORT}/api/dashboard`);
    if (!dashRes.success || !Array.isArray(dashRes.data)) {
      throw new Error(`Invalid Dashboard response: ${JSON.stringify(dashRes)}`);
    }
    console.log('✅ Dashboard returns array as expected:');
    dashRes.data.forEach(item => {
      console.log(`  - ${item.name}: ${item.totalAmount} (Icon: ${item.imageIcon})`);
    });

    // Test 2: Partners Filter
    console.log('Testing GET /api/partners (list & search)...');
    const partnersRes = await fetchJson(`http://localhost:${PORT}/api/partners?city=Delhi`);
    if (!partnersRes.success || !Array.isArray(partnersRes.data)) {
      throw new Error(`Invalid Partners response: ${JSON.stringify(partnersRes)}`);
    }
    console.log(`✅ Partners city search returned ${partnersRes.data.length} partners.`);

    // Test 3: Partners Pending
    console.log('Testing GET /api/partners/pending...');
    const pendingRes = await fetchJson(`http://localhost:${PORT}/api/partners/pending`);
    if (!pendingRes.success || !Array.isArray(pendingRes.data)) {
      throw new Error(`Invalid Pending Partners response: ${JSON.stringify(pendingRes)}`);
    }
    console.log(`✅ Pending partners returned ${pendingRes.data.length} partners.`);

    // Test 4: Booking Earnings
    console.log('Testing GET /api/earnings/bookings...');
    const bookingsRes = await fetchJson(`http://localhost:${PORT}/api/earnings/bookings`);
    if (!bookingsRes.success || bookingsRes.totalBookingEarnings === undefined || bookingsRes.totalTransactions === undefined) {
      throw new Error(`Invalid Booking Earnings response: ${JSON.stringify(bookingsRes)}`);
    }
    console.log(`✅ Booking earnings: Total = ${bookingsRes.totalBookingEarnings}, Transactions = ${bookingsRes.totalTransactions}`);

    // Test 5: Users Search
    console.log('Testing GET /api/users?query=Rahul...');
    const usersRes = await fetchJson(`http://localhost:${PORT}/api/users?query=Rahul`);
    if (!usersRes.success || !Array.isArray(usersRes.data)) {
      throw new Error(`Invalid Users response: ${JSON.stringify(usersRes)}`);
    }
    console.log(`✅ Users search returned ${usersRes.data.length} users (Expected matches: Rahul Sharma).`);
    usersRes.data.forEach(u => console.log(`  - ${u.name} (${u.email})`));

    // Test 6: Settings Banners Search & Commission Settings
    console.log('Testing GET /api/settings/banners?title=Summer...');
    const bannerRes = await fetchJson(`http://localhost:${PORT}/api/settings/banners?title=Summer`);
    if (!bannerRes.success || !Array.isArray(bannerRes.data)) {
      throw new Error(`Invalid Banners search response: ${JSON.stringify(bannerRes)}`);
    }
    console.log(`✅ Banners search returned ${bannerRes.data.length} banners.`);

    console.log('Testing GET /api/settings/commission...');
    const commRes = await fetchJson(`http://localhost:${PORT}/api/settings/commission`);
    if (!commRes.success || commRes.commissionRate === undefined) {
      throw new Error(`Invalid Commission response: ${JSON.stringify(commRes)}`);
    }
    console.log(`✅ Commission Rate: ${commRes.commissionRate}%`);

    // Test 7: Reports
    console.log('Testing GET /api/reports/users (date range filtered)...');
    const usersRepRes = await fetchJson(`http://localhost:${PORT}/api/reports/users?startDate=15-05-2026&endDate=19-05-2026`);
    if (!usersRepRes.success || !Array.isArray(usersRepRes.data)) {
      throw new Error(`Invalid Users report response: ${JSON.stringify(usersRepRes)}`);
    }
    console.log(`✅ Users report in range (15-05-2026 to 19-05-2026) returned ${usersRepRes.data.length} users.`);

    // Test 8: Support Tickets List
    console.log('Testing GET /api/support...');
    const supportRes = await fetchJson(`http://localhost:${PORT}/api/support`);
    if (!supportRes.success || !Array.isArray(supportRes.data)) {
      throw new Error(`Invalid Support response: ${JSON.stringify(supportRes)}`);
    }
    console.log(`✅ Support Tickets: returned ${supportRes.data.length} tickets.`);

    console.log('\n🎉 ALL LIVE API TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ LIVE API TEST FAILED:', error);
    process.exit(1);
  } finally {
    app.close();
  }
});
