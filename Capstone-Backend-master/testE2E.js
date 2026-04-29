const http = require('http');

const makeRequest = (options, data = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const isJson = res.headers['content-type']?.includes('application/json');
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: isJson && body ? JSON.parse(body) : body
                });
            });
        });
        req.on('error', reject);
        if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
        req.end();
    });
};

const runE2E = async () => {
    try {
        console.log('--- STARTING E2E TEST ---');

        // 1. Public Signup (Staff)
        console.log('\n[1] Testing Public Signup (Staff)');
        const staffReg = await makeRequest({
            hostname: 'localhost', port: 3000, path: '/api/auth/register', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            fullname: "Cloud Staff", email: "cloudstaff@saferoute.com", password: "password123", role: "staff", branch: "bus-01"
        });
        console.log(`Status: ${staffReg.status} | Success: ${staffReg.body?.success}`);

        // 2. Public Signup (Admin) - Should fail
        console.log('\n[2] Testing Admin Creation Protection');
        const adminReg = await makeRequest({
            hostname: 'localhost', port: 3000, path: '/api/auth/register', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            fullname: "Hacker Admin", email: "hacker@saferoute.com", password: "password123", role: "admin"
        });
        console.log(`Status: ${adminReg.status} | Blocked: ${adminReg.body?.errors?.includes('Invalid role. Admin creation not allowed via this public route.')}`);

        // 3. Login Staff
        console.log('\n[3] Testing Login (Staff)');
        const staffLogin = await makeRequest({
            hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: "cloudstaff@saferoute.com", password: "password123"
        });
        const cookie = staffLogin.headers['set-cookie']?.[0]?.split(';')[0];
        console.log(`Status: ${staffLogin.status} | Cookie Set: ${!!cookie}`);

        // 4. Role Redirect Check (Accessing Dashboard)
        console.log('\n[4] Testing Role Access');
        const dashboard = await makeRequest({
            hostname: 'localhost', port: 3000, path: '/api/stats/dashboard', method: 'GET',
            headers: { 'Cookie': cookie }
        });
        console.log(`Status: ${dashboard.status} | Success: ${dashboard.body?.success}`);

    } catch (e) {
        console.error(e);
    }
};

runE2E();
