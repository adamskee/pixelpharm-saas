/**
 * Make S3 Bucket Fully Public for Uploads
 * This script makes the bucket completely public for debugging the 403 issue
 */

require('dotenv').config({ path: '.env.local' });
const { 
  S3Client, 
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand,
  GetBucketLocationCommand
} = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Completely public bucket policy - no restrictions
const publicBucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::pixelpharm-uploads-prod/*'
    },
    {
      Sid: 'PublicUploadObject',
      Effect: 'Allow',
      Principal: '*',
      Action: [
        's3:PutObject',
        's3:PutObjectAcl'
      ],
      Resource: 'arn:aws:s3:::pixelpharm-uploads-prod/*'
    },
    {
      Sid: 'PublicListBucket',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:ListBucket',
      Resource: 'arn:aws:s3:::pixelpharm-uploads-prod'
    }
  ]
};

async function makeFullyPublic(bucketName) {
  try {
    console.log(`🔓 Making bucket ${bucketName} fully public...`);
    
    // Step 1: Remove all public access blocks
    console.log('📋 Step 1: Removing all public access blocks...');
    const publicAccessCommand = new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    });
    
    await s3.send(publicAccessCommand);
    console.log('✅ Public access blocks removed');
    
    // Step 2: Apply fully public policy
    console.log('📋 Step 2: Applying fully public bucket policy...');
    const policyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(publicBucketPolicy)
    });
    
    await s3.send(policyCommand);
    console.log('✅ Public bucket policy applied');
    
    // Step 3: Verify bucket location
    console.log('📋 Step 3: Verifying bucket location...');
    const locationCommand = new GetBucketLocationCommand({ Bucket: bucketName });
    const location = await s3.send(locationCommand);
    console.log('📍 Bucket location:', location.LocationConstraint || 'us-east-1');
    
    return true;
  } catch (error) {
    console.error('❌ Error making bucket public:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

async function testUploadPermissions(bucketName) {
  try {
    console.log(`🧪 Testing upload permissions for ${bucketName}...`);
    
    // Test creating a presigned URL
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    
    const testCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'test-upload.txt',
      ContentType: 'text/plain'
    });
    
    const testUrl = await getSignedUrl(s3, testCommand, { expiresIn: 900 });
    console.log('✅ Presigned URL generated successfully');
    console.log('🔗 Test URL domain:', new URL(testUrl).hostname);
    
    // Extract credentials info from the URL
    const urlParams = new URL(testUrl).searchParams;
    const credential = urlParams.get('X-Amz-Credential');
    console.log('🔑 Signing credential:', credential);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing permissions:', error.message);
    return false;
  }
}

async function main() {
  const bucketName = 'pixelpharm-uploads-prod';
  
  console.log('🚀 Make S3 Bucket Fully Public for Debugging');
  console.log('===========================================');
  console.log(`🎯 Target Bucket: ${bucketName}`);
  console.log(`🌍 AWS Region: ${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}`);
  console.log('');
  console.log('⚠️  WARNING: This will make the bucket FULLY PUBLIC');
  console.log('   Use only for debugging - restrict access later!');
  console.log('');
  
  try {
    // Make bucket fully public
    const success = await makeFullyPublic(bucketName);
    
    if (success) {
      console.log('\n🎉 Bucket is now fully public!');
      
      // Test permissions
      await testUploadPermissions(bucketName);
      
      console.log('\n📋 What was configured:');
      console.log('   ✅ All public access blocks disabled');
      console.log('   ✅ Public read access enabled');
      console.log('   ✅ Public upload access enabled');
      console.log('   ✅ Public list access enabled');
      console.log('');
      console.log('🚀 Any valid AWS credentials should now be able to upload!');
      console.log('');
      console.log('🔄 Please test the upload again now.');
      
    } else {
      console.log('\n❌ Failed to make bucket public');
    }
    
  } catch (error) {
    console.error('💥 Configuration failed:', error.message);
    console.log('');
    console.log('🔧 If this fails, the issue may be:');
    console.log('1. Production uses different AWS account');
    console.log('2. Production uses IAM role without cross-account permissions');
    console.log('3. Bucket policy conflicts with account-level restrictions');
    console.log('');
    console.log('💡 Alternative: Check Vercel AWS integration settings');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}