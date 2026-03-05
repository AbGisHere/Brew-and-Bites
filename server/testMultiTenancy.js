const http = require('http');

const API_URL = 'http://localhost:5001';

async function request(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    try {
        console.log("1. Logging in as Super Admin (AbG)...");
        const loginRes = await request('/api/login', 'POST', { username: 'AbG', password: 'GitHub--AbGisHere' });
        console.log(loginRes.status, loginRes.data.username);
        if (loginRes.status !== 200) throw new Error("Login failed");

        const token = loginRes.data.id;
        const authHeaders = { 'Authorization': `Bearer ${token}` };

        console.log("\n2. Fetching restaurants...");
        const restRes = await request('/api/superadmin/restaurants', 'GET', null, authHeaders);
        console.log(restRes.status, `Found ${restRes.data?.length || 0} restaurants`);
        if (restRes.status !== 200) {
            console.error(restRes.data);
            throw new Error(`Fetch failed with status ${restRes.status}`);
        }

        console.log("\n3. Creating Test Cafe...");
        const createRes = await request('/api/superadmin/restaurants', 'POST', { name: 'Test Cafe' }, authHeaders);
        console.log(createRes.status, createRes.data.name);
        if (createRes.status !== 200) throw new Error("Create failed");
        const testCafeId = createRes.data._id;

        console.log("\n4. Checking isolation by fetching menu for Test Cafe (Should be empty)...");
        const menuRes1 = await request('/api/menu', 'GET', null, { 'x-restaurant-id': testCafeId });
        console.log(menuRes1.status, `Found ${menuRes1.data.length} items`);
        if (menuRes1.data.length !== 0) throw new Error("Isolation failed");

        console.log("\n5. Suspending Test Cafe...");
        const suspendRes = await request(`/api/superadmin/restaurants/${testCafeId}/toggle`, 'PUT', null, authHeaders);
        console.log(suspendRes.status, suspendRes.data.status);
        if (suspendRes.data.status !== 'suspended') throw new Error("Suspend failed");

        console.log("\n6. Trying to fetch menu for suspended Test Cafe (Should be 403 Forbidden)...");
        const menuRes2 = await request('/api/menu', 'GET', null, { 'x-restaurant-id': testCafeId });
        console.log({ status: menuRes2.status, error: menuRes2.data.error });
        if (menuRes2.status !== 403) throw new Error("Suspension enforcement failed");

        console.log("\n7. Fetch analytics...");
        const analyticsRes = await request('/api/superadmin/analytics', 'GET', null, authHeaders);
        console.log(analyticsRes.status, analyticsRes.data);

        console.log("\n✅ ALL TESTS PASSED!");
    } catch (e) {
        console.error("❌ TEST FAILED:", e.message);
    }
}

runTests();
