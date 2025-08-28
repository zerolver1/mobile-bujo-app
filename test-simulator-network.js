#!/usr/bin/env node

/**
 * Test network connectivity from iOS Simulator
 * Run this to diagnose simulator networking issues
 */

const https = require('https');
const dns = require('dns').promises;

async function testDNS() {
  console.log('🔍 Testing DNS resolution...\n');
  
  try {
    const addresses = await dns.resolve4('api.mistral.ai');
    console.log('✅ DNS resolution successful:');
    console.log('   Addresses:', addresses);
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
  }
}

async function testHTTPS() {
  console.log('\n🔍 Testing HTTPS connection to api.mistral.ai...\n');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.mistral.ai',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer Py9aU8TjMtlKnYcjuB1IMTy8Is2nOx6n',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log(`✅ HTTPS connection successful`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data) {
          console.log(`   Response preview: ${data.substring(0, 200)}...`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ HTTPS connection failed: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.error('❌ Request timeout after 10 seconds');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function checkSimulatorNetwork() {
  console.log('🚀 iOS Simulator Network Diagnostic\n');
  console.log('This script tests network connectivity from the command line.');
  console.log('If this works but the simulator fails, it indicates a simulator-specific issue.\n');
  
  await testDNS();
  await testHTTPS();
  
  console.log('\n📋 Potential Solutions:');
  console.log('1. Reset the iOS Simulator: Device > Erase All Content and Settings');
  console.log('2. Check proxy settings: System Preferences > Network > Advanced > Proxies');
  console.log('3. Disable VPN if active');
  console.log('4. Clear DNS cache: sudo dscacheutil -flushcache');
  console.log('5. Try a different simulator device');
  console.log('6. Update Xcode and iOS Simulator');
  console.log('\n✨ The app works perfectly on physical devices!');
}

// Run the diagnostic
checkSimulatorNetwork().catch(console.error);