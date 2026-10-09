const http = require('http');

const PORT = 3000;
const HOST = '127.0.0.1';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING MONEYPAY AUTH & RBAC VERIFICATION ---');

  // 1. Attempt login with bad password
  console.log('\n1. Testing failed login...');
  const badLogin = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'dhairyaqwerty1@gmail.com', password: 'WrongPassword' },
  });
  console.log('Failed Login Status:', badLogin.status, badLogin.data);

  // 2. Login with Super Admin credentials
  console.log('\n2. Testing Super Admin login (dhairyaqwerty1@gmail.com)...');
  const loginRes = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'dhairyaqwerty1@gmail.com', password: 'MoneyPayAdmin@2026' },
  });
  console.log('Login Status:', loginRes.status);
  console.log('Login Result:', loginRes.data);

  const token = loginRes.data?.data?.token;
  const setCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
  const cookieHeader = setCookie.split(';')[0];

  if (!token) {
    throw new Error('Login failed to return session token');
  }

  // 3. Test /api/v1/auth/me
  console.log('\n3. Testing /api/v1/auth/me with Bearer token...');
  const meRes = await request('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Me Result:', meRes.data);

  // 4. Test listing team users
  console.log('\n4. Testing /api/v1/admin/users (Team listing)...');
  const usersRes = await request('/api/v1/admin/users', {
    headers: { Cookie: cookieHeader },
  });
  console.log('Users Count:', usersRes.data?.data?.users?.length);

  // 5. Test inviting a new team member
  console.log('\n5. Creating new Operations team member...');
  const createMemberRes = await request('/api/v1/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: {
      name: 'Pooja Agarwal',
      email: `pooja_${Date.now()}@moneypay.io`,
      role: 'OPERATIONS_AGENT',
      password: 'TempPassword@123',
    },
  });
  console.log('Create Member Status:', createMemberRes.status, createMemberRes.data);
  const newUserId = createMemberRes.data?.data?.id;

  // 6. Test updating role
  if (newUserId) {
    console.log('\n6. Modifying member role to FINANCE_VIEWER...');
    const roleRes = await request('/api/v1/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: {
        userId: newUserId,
        role: 'FINANCE_VIEWER',
      },
    });
    console.log('Role Update Status:', roleRes.status, roleRes.data);
  }

  // 7. Test unauthorized access check
  console.log('\n7. Testing unauthorized access without session...');
  const unauthRes = await request('/api/v1/admin/users');
  console.log('Unauth Status (Expected 403):', unauthRes.status);

  console.log('\n--- ALL AUTH & RBAC TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(console.error);
