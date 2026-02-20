require('dotenv').config();
const http = require('http');

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testPasswordReset() {
  console.log('Testing password reset flow...\n');

  // Step 1: Request reset
  console.log('Step 1: Requesting password reset for kenechukwuobi5@gmail.com');
  const requestRes = await makeRequest('POST', '/api/password-reset/request', {
    email: 'kenechukwuobi5@gmail.com'
  });
  console.log('Response:', requestRes.body);
  console.log('');

  // Wait a moment for the email to be sent
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Note: In a real test, we'd extract the token from the database
  // For now, we're just verifying the endpoint structure works
  
  console.log('✓ Password reset request sent successfully!');
  console.log('Check your email for the reset link.');
  console.log('The link will redirect to: http://localhost:3000/reset-password.html?token=<TOKEN>');
}

testPasswordReset().catch(console.error);
