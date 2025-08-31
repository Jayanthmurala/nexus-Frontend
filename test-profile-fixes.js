// Test script to verify profile API integration fixes
const axios = require('axios');

const PROFILE_API_BASE = 'http://localhost:4002';
const AUTH_API_BASE = 'http://localhost:4001';

async function testProfileApiIntegration() {
  console.log('🧪 Testing Profile API Integration Fixes...\n');
  
  const tests = [
    {
      name: 'Badge Definitions Endpoint',
      url: `${PROFILE_API_BASE}/v1/badge-definitions`,
      method: 'GET',
      description: 'Should return badge definitions'
    },
    {
      name: 'Recent Awards Endpoint (NEW)',
      url: `${PROFILE_API_BASE}/v1/badges/recent?limit=5`,
      method: 'GET',
      description: 'Should return recent badge awards'
    },
    {
      name: 'Award Counts Endpoint (NEW)',
      url: `${PROFILE_API_BASE}/v1/badges/counts`,
      method: 'GET',
      description: 'Should return badge award counts'
    },
    {
      name: 'Colleges Endpoint (Proxy)',
      url: `${PROFILE_API_BASE}/v1/colleges`,
      method: 'GET',
      description: 'Should proxy to auth service'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await axios.get(test.url, {
        timeout: 5000,
        validateStatus: () => true // Don't throw on non-2xx status
      });
      
      if (response.status === 200) {
        console.log(`   ✅ SUCCESS: ${response.status}`);
        console.log(`   📊 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      } else if (response.status === 401) {
        console.log(`   ⚠️  AUTH REQUIRED: ${response.status} (Expected for protected endpoints)`);
      } else {
        console.log(`   ❌ FAILED: ${response.status} - ${response.statusText}`);
        if (response.data) {
          console.log(`   📄 Error: ${JSON.stringify(response.data)}`);
        }
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   🔌 CONNECTION FAILED: Profile service not running on port 4002`);
      } else {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('🎯 Test Summary:');
  console.log('   - If you see CONNECTION FAILED, start the profile service');
  console.log('   - If you see AUTH REQUIRED, the endpoints are working (need auth token)');
  console.log('   - If you see SUCCESS, the endpoints are working correctly');
  console.log('\n📝 To run the services:');
  console.log('   Backend: cd nexusbackend/profile-service && npm run dev');
  console.log('   Frontend: cd nexus && npm run dev');
}

testProfileApiIntegration().catch(console.error);
