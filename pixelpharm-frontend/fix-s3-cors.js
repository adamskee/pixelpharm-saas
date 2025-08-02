/**
 * S3 CORS Configuration Script
 * 
 * This script helps configure CORS for the PixelPharm S3 bucket to allow uploads from production.
 * 
 * Usage:
 * node fix-s3-cors.js
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, GetBucketCorsCommand, PutBucketCorsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

// Configure AWS S3 Client
const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// CORS configuration for PixelPharm production
const corsConfiguration = {
  CORSRules: [
    {
      ID: 'PixelPharmProductionUploads',
      AllowedOrigins: [
        'https://pixelpharm.com',
        'https://www.pixelpharm.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002'
      ],
      AllowedMethods: [
        'GET',
        'PUT',
        'POST',
        'DELETE',
        'HEAD'
      ],
      AllowedHeaders: [
        '*'
      ],
      ExposeHeaders: [
        'ETag',
        'x-amz-meta-custom-header'
      ],
      MaxAgeSeconds: 3600
    }
  ]
};

async function getCurrentCORSConfig(bucketName) {
  try {
    console.log(`🔍 Checking current CORS configuration for ${bucketName}...`);
    const command = new GetBucketCorsCommand({ Bucket: bucketName });
    const result = await s3.send(command);
    console.log('📋 Current CORS Configuration:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    if (error.name === 'NoSuchCORSConfiguration') {
      console.log('⚠️  No CORS configuration found - this is the problem!');
      return null;
    } else {
      console.error('❌ Error getting CORS configuration:', error);
      throw error;
    }
  }
}

async function setCORSConfig(bucketName) {
  try {
    console.log(`🔧 Setting CORS configuration for ${bucketName}...`);
    console.log('📝 CORS Configuration to apply:');
    console.log(JSON.stringify(corsConfiguration, null, 2));
    
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    });
    
    await s3.send(command);
    
    console.log('✅ CORS configuration updated successfully!');
    
    // Wait a moment for the configuration to propagate
    console.log('⏳ Waiting for configuration to propagate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the configuration was applied
    await getCurrentCORSConfig(bucketName);
    
  } catch (error) {
    console.error('❌ Error setting CORS configuration:', error);
    throw error;
  }
}

async function testBucketAccess(bucketName) {
  try {
    console.log(`🧪 Testing bucket access for ${bucketName}...`);
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await s3.send(command);
    console.log('✅ Bucket access confirmed');
    return true;
  } catch (error) {
    console.error('❌ Bucket access failed:', error.message);
    return false;
  }
}

async function main() {
  // Check both possible bucket names
  const bucketNames = [
    'pixelpharm-uploads-prod',
    'pixelpharm-uploads-prod-463470967804',
    process.env.AWS_S3_BUCKET_NAME
  ].filter(Boolean).filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates
  
  console.log('🚀 PixelPharm S3 CORS Configuration Tool');
  console.log('=====================================');
  console.log(`🎯 Checking buckets: ${bucketNames.join(', ')}`);
  console.log(`🌍 AWS Region: ${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}`);
  console.log(`🔑 AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 4) + '...' : 'NOT SET'}`);
  console.log(`🔐 AWS Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
  console.log('');

  let successCount = 0;

  for (const bucketName of bucketNames) {
    console.log(`\n🔄 Processing bucket: ${bucketName}`);
    try {
      // Test bucket access
      const hasAccess = await testBucketAccess(bucketName);
      if (!hasAccess) {
        console.log(`❌ Cannot access bucket: ${bucketName}`);
        continue;
      }

      // Get current CORS configuration
      const currentCors = await getCurrentCORSConfig(bucketName);
      
      // Set new CORS configuration
      await setCORSConfig(bucketName);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to configure ${bucketName}:`, error.message);
    }
  }
    
  console.log('');
  console.log(`🎉 CORS configuration complete! (${successCount}/${bucketNames.length} buckets configured)`);
  console.log('');
  console.log('📋 What was configured:');
  console.log('   ✅ Allow uploads from https://pixelpharm.com');
  console.log('   ✅ Allow uploads from https://www.pixelpharm.com');
  console.log('   ✅ Allow development uploads from localhost');
  console.log('   ✅ Support for PUT, POST, GET, DELETE, HEAD methods');
  console.log('   ✅ Allow all headers (*)');
  console.log('   ✅ Cache for 1 hour (3600 seconds)');
  console.log('');
  console.log('🚀 Users should now be able to upload files successfully!');
  
  if (successCount === 0) {
    console.log('');
    console.log('🔧 Manual CORS Configuration:');
    console.log('If no buckets were configured, you can manually configure CORS in AWS Console:');
    console.log('1. Go to AWS S3 Console');
    console.log('2. Navigate to the correct bucket');
    console.log('3. Go to Permissions > Cross-origin resource sharing (CORS)');
    console.log('4. Paste this configuration:');
    console.log('');
    console.log(JSON.stringify(corsConfiguration.CORSRules, null, 2));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getCurrentCORSConfig,
  setCORSConfig,
  corsConfiguration
};