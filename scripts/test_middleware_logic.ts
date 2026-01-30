
import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Polyfill btoa for test generation
const btoa = (str: string) => Buffer.from(str).toString('base64');

// Mock NextRequest
function createRequest(url: string, headers: Record<string, string> = {}) {
  return new Request(new URL(url, 'http://localhost:3000'), {
      headers: headers
  }) as unknown as NextRequest;
}

async function runTests() {
  console.log('🛡️ Starting Auth Verification...');

  process.env.ADMIN_PASSWORD = 'supersecretpass';

  const cases = [
    {
      name: 'No Auth Header',
      url: '/api/summaries',
      headers: {},
      expectedStatus: 401,
    },
    {
      name: 'Valid Auth',
      url: '/api/summaries',
      headers: { 'Authorization': 'Basic ' + btoa('admin:supersecretpass') },
      expectedStatus: 200,
    },
    {
      name: 'Invalid Password',
      url: '/api/summaries',
      headers: { 'Authorization': 'Basic ' + btoa('admin:wrongpass') },
      expectedStatus: 401,
    },
     {
      name: 'Invalid Username',
      url: '/api/summaries',
      headers: { 'Authorization': 'Basic ' + btoa('user:supersecretpass') },
      expectedStatus: 401,
    },
    {
      name: 'Malformed Header',
      url: '/api/summaries',
      headers: { 'Authorization': 'Bearer token' }, // Not Basic
      expectedStatus: 401,
    }
  ];

  let passed = true;

  for (const c of cases) {
    try {
        const req = createRequest(c.url, c.headers);
        const res = await middleware(req);

        const status = res.status;
        const isPass = (c.expectedStatus === 200 && status === 200) || (c.expectedStatus !== 200 && status === c.expectedStatus);

        if (!isPass) {
          console.error(`❌ Case failed: ${c.name}. Expected ${c.expectedStatus}, got ${status}`);
          passed = false;
        } else {
          console.log(`✅ Case passed: ${c.name}`);
        }
    } catch (e) {
        console.error(`❌ Case failed with error: ${c.name}`, e);
        passed = false;
    }
  }

  if (passed) {
    console.log('🎉 All auth tests passed!');
  } else {
    console.error('💥 Some tests failed.');
    process.exit(1);
  }
}

runTests();
