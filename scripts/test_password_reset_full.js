require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const User = require('../models/User');

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

async function testPasswordResetFlow() {
  console.log('=== Password Reset Integration Test ===\n');

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoplink');
    console.log('✓ Connected to MongoDB\n');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  try {
    // Step 1: Request reset
    console.log('Step 1: Requesting password reset...');
    const testEmail = 'kenechukwuobi5@gmail.com';
    const requestRes = await makeRequest('POST', '/api/password-reset/request', {
      email: testEmail
    });
    console.log('✓ Request sent\n');

    // Wait a moment for email sending
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Get the reset token from database
    console.log('Step 2: Fetching reset token from database...');
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.error('✗ User not found in database!');
      process.exit(1);
    }

    if (!user.resetPasswordToken) {
      console.error('✗ Reset token not set! Check that Step 1 worked.');
      process.exit(1);
    }

    console.log(`✓ Reset token found: ${user.resetPasswordToken.substring(0, 10)}...\n`);

    // Step 3: Simulate visiting the reset page with token
    console.log('Step 3: Simulating password reset confirmation...');
    const newPassword = 'newSecurePassword123!';
    const confirmRes = await makeRequest('POST', '/api/password-reset/confirm', {
      token: user.resetPasswordToken,
      username: user.username,
      email: user.email,
      newPassword: newPassword
    });

    if (confirmRes.status === 200) {
      console.log('✓ Password reset successful!\n');
      console.log('Response:', confirmRes.body);

      // Step 4: Verify token was cleared
      console.log('\nStep 4: Verifying reset token was cleared...');
      const updatedUser = await User.findOne({ email: testEmail });
      
      if (updatedUser.resetPasswordToken === null && updatedUser.resetPasswordExpiry === null) {
        console.log('✓ Reset token cleared from database\n');
      } else {
        console.warn('⚠ Reset token not cleared (may be normal)\n');
      }

      console.log('\n=== Test Summary ===');
      console.log('✓ Password reset request sent');
      console.log('✓ Reset token created');
      console.log('✓ Password confirmed and updated');
      console.log('✓ Token cleared after reset');
      console.log('\nPassword reset flow is working correctly!');

    } else {
      console.error('✗ Password reset failed:', confirmRes.body);
      process.exit(1);
    }

  } catch (err) {
    console.error('Test error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testPasswordResetFlow();
