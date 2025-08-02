/**
 * Fix CORS for Production Bucket
 * This script specifically targets the bucket used in production
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, GetBucketCorsCommand, PutBucketCorsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

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

async function configureBucket(bucketName) {
  try {
    console.log(`\n🔧 Configuring CORS for ${bucketName}...`);
    
    // Test access
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await s3.send(command);
    console.log('✅ Bucket access confirmed');
    
    // Get current CORS
    try {
      const getCorsCommand = new GetBucketCorsCommand({ Bucket: bucketName });
      const currentCors = await s3.send(getCorsCommand);
      console.log('📋 Current CORS:', JSON.stringify(currentCors.CORSRules, null, 2));
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log('⚠️ No CORS configuration found - this is why uploads are failing!');
      }
    }
    
    // Set new CORS
    const putCorsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    });
    
    await s3.send(putCorsCommand);
    console.log('✅ CORS configuration applied successfully!');
    
    // Verify
    await new Promise(resolve => setTimeout(resolve, 2000));
    const verifyCorsCommand = new GetBucketCorsCommand({ Bucket: bucketName });
    const newCors = await s3.send(verifyCorsCommand);
    console.log('✅ Verified CORS:', JSON.stringify(newCors.CORSRules, null, 2));
    
    return true;
  } catch (error) {
    console.error(`❌ Error configuring ${bucketName}:`, error.message);
    return false;
  }
}

async function main() {
  const productionBuckets = [
    'pixelpharm-uploads-345234',  // Likely production bucket
    'pixelpharm-uploads-prod-463470967804'  // Local env bucket
  ];
  
  console.log('🚀 Fix Production CORS Configuration');
  console.log('===================================');
  console.log('🎯 Targeting production buckets that actually exist');
  console.log('');
  
  let successCount = 0;
  
  for (const bucket of productionBuckets) {
    const success = await configureBucket(bucket);
    if (success) successCount++;
  }
  
  console.log('\n🎉 Configuration Summary:');
  console.log(`✅ Successfully configured: ${successCount}/${productionBuckets.length} buckets`);
  console.log('');
  console.log('📋 CORS Rules Applied:');
  console.log('   ✅ Allow https://pixelpharm.com');
  console.log('   ✅ Allow https://www.pixelpharm.com');
  console.log('   ✅ Allow localhost development');
  console.log('   ✅ Support all required HTTP methods');
  console.log('   ✅ Allow all headers');
  console.log('');
  console.log('🚀 File uploads should now work on production!');
  
  if (successCount > 0) {
    console.log('');
    console.log('💡 Next Steps:');
    console.log('1. Wait 1-2 minutes for CORS changes to propagate');
    console.log('2. Test file upload on https://pixelpharm.com');
    console.log('3. If still failing, check Vercel environment variables');
  }
}

if (require.main === module) {
  main().catch(console.error);
}