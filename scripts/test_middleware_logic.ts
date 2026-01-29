import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

// Mock process.env
process.env.ADMIN_PASSWORD = 'secret_password';

async function runTests() {
  console.log('Running Middleware Tests...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ ${msg}`);
      passed++;
    } else {
      console.error(`❌ ${msg}`);
      failed++;
    }
  }

  // Test 1: No Auth Header
  try {
    const req = new NextRequest('http://localhost/api/approve');
    const res = middleware(req);
    assert(res.status === 401, 'No auth header should return 401');
  } catch (e) {
    console.error('Test 1 failed with error:', e);
    failed++;
  }

  // Test 2: Wrong Password
  try {
    const req = new NextRequest('http://localhost/api/approve');
    req.headers.set('Authorization', 'Basic ' + btoa('admin:wrong'));
    const res = middleware(req);
    assert(res.status === 401, 'Wrong password should return 401');
  } catch (e) {
    console.error('Test 2 failed with error:', e);
    failed++;
  }

  // Test 3: Wrong Username
  try {
    const req = new NextRequest('http://localhost/api/approve');
    req.headers.set('Authorization', 'Basic ' + btoa('user:secret_password'));
    const res = middleware(req);
    assert(res.status === 401, 'Wrong username should return 401');
  } catch (e) {
    console.error('Test 3 failed with error:', e);
    failed++;
  }

  // Test 4: Correct Credentials
  try {
    const req = new NextRequest('http://localhost/api/approve');
    req.headers.set('Authorization', 'Basic ' + btoa('admin:secret_password'));
    const res = middleware(req);
    assert(res.status !== 401, 'Correct credentials should not return 401');
  } catch (e) {
    console.error('Test 4 failed with error:', e);
    failed++;
  }

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
