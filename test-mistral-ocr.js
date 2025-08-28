#!/usr/bin/env node

/**
 * Simple test script for Mistral OCR API
 * Run this with: node test-mistral-ocr.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = 'Py9aU8TjMtlKnYcjuB1IMTy8Is2nOx6n';
const API_URL = 'https://api.mistral.ai/v1/ocr';

// Test image - create a simple test image or use existing one
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 pixel PNG

async function testMistralConnection() {
  console.log('🔍 Testing Mistral API Connection...\n');
  
  try {
    console.log('1. Testing basic API connectivity...');
    const modelsResponse = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${modelsResponse.status}`);
    console.log(`   Headers:`, Object.fromEntries(modelsResponse.headers.entries()));

    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      console.log('   ✅ API Connection successful!');
      console.log(`   Available models: ${modelsData.data?.length || 0} models`);
      
      // Check if OCR model is available
      const ocrModel = modelsData.data?.find(m => m.id.includes('ocr'));
      if (ocrModel) {
        console.log(`   📄 OCR Model found: ${ocrModel.id}`);
      } else {
        console.log('   ⚠️  No OCR models found in available models');
      }
    } else {
      const error = await modelsResponse.text();
      console.log('   ❌ API Connection failed:', error);
      return false;
    }

    console.log('\n2. Testing OCR endpoint...');
    
    const ocrPayload = {
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${TEST_IMAGE_BASE64}`
        }
      }
    };

    console.log('   Request payload:', JSON.stringify(ocrPayload, null, 2));

    const ocrResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ocrPayload),
    });

    console.log(`   OCR Status: ${ocrResponse.status}`);
    console.log(`   OCR Headers:`, Object.fromEntries(ocrResponse.headers.entries()));

    if (ocrResponse.ok) {
      const ocrData = await ocrResponse.json();
      console.log('   ✅ OCR Request successful!');
      console.log('   Response:', JSON.stringify(ocrData, null, 2));
    } else {
      const error = await ocrResponse.text();
      console.log('   ❌ OCR Request failed:', error);
      
      // Try to parse error as JSON for better formatting
      try {
        const errorJson = JSON.parse(error);
        console.log('   Formatted error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Error is not JSON, already logged above
      }
      
      return false;
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('Full error:', error);
    return false;
  }

  return true;
}

async function testDifferentEndpoints() {
  console.log('\n3. Testing alternative endpoints...\n');
  
  const endpoints = [
    'https://api.mistral.ai/v1/ocr',
    'https://api.mistral.ai/ocr',
    'https://api.mistral.ai/v1/vision',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${TEST_IMAGE_BASE64}`
            }
          }
        }),
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ ${endpoint} works!`);
        const data = await response.json();
        console.log('   Response preview:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        return endpoint; // Return the working endpoint
      } else {
        const error = await response.text();
        console.log(`   ❌ ${endpoint} failed: ${error.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} network error:`, error.message);
    }
    
    console.log(''); // Add spacing
  }
  
  return null;
}

async function testWithSampleImage() {
  console.log('\n4. Testing with sample bullet journal text...\n');
  
  // Create a simple test image with text (base64 encoded)
  const sampleTextImage = 'iVBORw0KGgoAAAANSUhEUgAAAoAAAAEsCAMAAABfYD0OAAAAMFBMVEX///8AAAD29vZmZmYzMzPMzMyZmZnf39+9vb1ZWVn6+vr09PT+/v7t7e3j4+Pr6+tYN8OjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH5QsEFCQzWnSeAAAAACR0RVh0Q29tbWVudABDcmVhdGVkIGJ5IEFkb2JlIFBob3Rvc2hvcCBleCBSDC8oAAACJElEQVR42u3TMQEAAAQEQIGBVgbhDhbxN71P9f6AY5AjYQARILgBAg=='; // Sample base64 image
  
  try {
    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${sampleTextImage}`
          }
        }
      }),
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Sample image processed successfully!');
      console.log('   Extracted text:', data.document_annotation || 'No text extracted');
      console.log('   Full response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('   ❌ Sample image processing failed:', error);
    }
  } catch (error) {
    console.log('   ❌ Network error with sample image:', error.message);
  }
}

// Run the tests
async function main() {
  console.log('🚀 Mistral OCR API Test Suite\n');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`API URL: ${API_URL}\n`);
  
  const connectionOk = await testMistralConnection();
  
  if (!connectionOk) {
    const workingEndpoint = await testDifferentEndpoints();
    if (workingEndpoint) {
      console.log(`✅ Found working endpoint: ${workingEndpoint}`);
    } else {
      console.log('❌ No working endpoints found');
    }
  }
  
  await testWithSampleImage();
  
  console.log('\n🏁 Test completed!');
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testMistralConnection };