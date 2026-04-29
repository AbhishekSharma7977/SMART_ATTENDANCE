const http = require('http');

// 1. Login as Admin
const loginAdminData = JSON.stringify({
    email: "admin@saferoute.com",
    password: "admin123"
});

const req1 = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginAdminData.length
    }
}, res1 => {
    let body1 = '';
    let cookie = res1.headers['set-cookie'] ? res1.headers['set-cookie'][0] : '';
    res1.on('data', c => body1 += c);
    res1.on('end', () => {
        console.log('Admin login status:', res1.statusCode);
        console.log('Admin login cookie:', cookie);

        // 2. Create User
        const regData = JSON.stringify({
            fullname: "Test User 5",
            email: "test5@saferoute.com",
            password: "password123",
            role: "staff"
        });
        
        const req2 = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': regData.length,
                'Cookie': cookie
            }
        }, res2 => {
            let body2 = '';
            res2.on('data', c => body2 += c);
            res2.on('end', () => {
                console.log('Register status:', res2.statusCode);
                console.log('Register response:', body2);

                // 3. Login as new user
                const loginNewData = JSON.stringify({
                    email: "test5@saferoute.com",
                    password: "password123"
                });
                const req3 = http.request({
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/auth/login',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': loginNewData.length
                    }
                }, res3 => {
                    let body3 = '';
                    res3.on('data', c => body3 += c);
                    res3.on('end', () => {
                        console.log('New User login status:', res3.statusCode);
                        console.log('New User login response:', body3);
                    });
                });
                req3.write(loginNewData);
                req3.end();
            });
        });
        req2.write(regData);
        req2.end();
    });
});
req1.write(loginAdminData);
req1.end();
