// Backend Status Check Script
// Run this to diagnose backend issues

import http from 'http';

const PORT = 5000;
const HOST = 'localhost';

console.log('🔍 Checking Backend Status...\n');

// Check 1: Is port 5000 accessible?
console.log('Test 1: Checking if port 5000 is accessible...');
const options = {
  hostname: HOST,
  port: PORT,
  path: '/api/auth/check',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Port ${PORT} is accessible!`);
  console.log(`   Status Code: ${res.statusCode}`);
  console.log(`   Status Message: ${res.statusMessage}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n✅ Backend is RUNNING!\n');
    console.log('📋 Next Steps:');
    console.log('1. Hard refresh browser: Ctrl + Shift + R');
    console.log('2. Clear browser cache if needed');
    console.log('3. Try accepting friend request again');
    console.log('\nIf still getting CORS error:');
    console.log('- Make sure you restarted backend AFTER updating app.js');
    console.log('- Check backend terminal shows: "Server running on port 5000"');
  });
});

req.on('error', (error) => {
  console.log(`❌ Cannot connect to port ${PORT}`);
  console.log(`   Error: ${error.message}\n`);
  
  console.log('🔧 Backend is NOT running!\n');
  console.log('📋 To fix this:');
  console.log('1. Open terminal');
  console.log('2. cd codeorbit_backend');
  console.log('3. npm run dev');
  console.log('4. Wait for "Server running on port 5000"');
  console.log('5. Run this script again to verify\n');
});

req.on('timeout', () => {
  console.log('❌ Request timed out');
  console.log('   Backend might be starting up or stuck\n');
  req.destroy();
});

req.end();

// Check 2: Check if node process is running
console.log('\nTest 2: Checking for Node.js processes...');
import { exec } from 'child_process';

exec('netstat -ano | findstr :5000', (error, stdout, stderr) => {
  if (stdout) {
    console.log('✅ Process found on port 5000:');
    console.log(stdout);
  } else {
    console.log('❌ No process found on port 5000');
  }
});
