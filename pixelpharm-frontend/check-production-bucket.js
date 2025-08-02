/**
 * Production Bucket Checker
 * This script checks which bucket production is actually trying to use
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function listBuckets() {
  try {
    console.log('🔍 Listing all available S3 buckets...\n');
    
    const command = new ListBucketsCommand({});
    const result = await s3.send(command);
    
    console.log('📋 Available buckets:');
    result.Buckets?.forEach((bucket, index) => {
      console.log(`${index + 1}. ${bucket.Name} (created: ${bucket.CreationDate?.toISOString()})`);
    });
    
    console.log('\n🔍 Looking for PixelPharm buckets...');
    const pixelpharmBuckets = result.Buckets?.filter(bucket => 
      bucket.Name?.includes('pixelpharm')
    ) || [];
    
    if (pixelpharmBuckets.length > 0) {
      console.log('\n🎯 PixelPharm buckets found:');
      pixelpharmBuckets.forEach((bucket, index) => {
        console.log(`${index + 1}. ${bucket.Name}`);
        
        // Check if this matches the expected pattern
        if (bucket.Name === 'pixelpharm-uploads-prod') {
          console.log('   ⚠️  This bucket matches the production URL!');
        }
        if (bucket.Name === 'pixelpharm-uploads-prod-463470967804') {
          console.log('   ✅ This bucket matches local .env.local');
        }
      });
      
      console.log('\n💡 Recommendation:');
      console.log('The production environment should use:', pixelpharmBuckets[0]?.Name);
      console.log('Update Vercel environment variable AWS_S3_BUCKET_NAME to this value.');
      
    } else {
      console.log('❌ No PixelPharm buckets found!');
    }
    
  } catch (error) {
    console.error('❌ Error listing buckets:', error.message);
  }
}

async function main() {
  console.log('🚀 Production Bucket Checker');
  console.log('============================');
  console.log(`🌍 AWS Region: ${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}`);
  console.log(`🔑 AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 4) + '...' : 'NOT SET'}`);
  console.log('');
  
  await listBuckets();
}

if (require.main === module) {
  main().catch(console.error);
}