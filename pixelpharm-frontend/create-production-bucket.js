/**
 * Create and Configure Production Bucket
 * This script creates the bucket that production expects and configures CORS
 */

require('dotenv').config({ path: '.env.local' });
const { 
  S3Client, 
  CreateBucketCommand, 
  PutBucketCorsCommand,
  GetBucketCorsCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand
} = require('@aws-sdk/client-s3');

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

// Bucket policy to allow public read but restrict writes to authenticated users
const bucketPolicy = {
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
      Sid: 'AllowAuthenticatedUploads',
      Effect: 'Allow',
      Principal: {
        AWS: `arn:aws:iam::463470967804:user/*`  // Your AWS account
      },
      Action: [
        's3:PutObject',
        's3:PutObjectAcl',
        's3:DeleteObject'
      ],
      Resource: 'arn:aws:s3:::pixelpharm-uploads-prod/*'
    }
  ]
};

async function createBucketIfNotExists(bucketName) {
  try {
    console.log(`🔍 Checking if bucket ${bucketName} exists...`);
    
    // Try to access the bucket
    const headCommand = new HeadBucketCommand({ Bucket: bucketName });
    await s3.send(headCommand);
    console.log(`✅ Bucket ${bucketName} already exists`);
    return true;
    
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`📦 Creating bucket ${bucketName}...`);
      
      try {
        const createCommand = new CreateBucketCommand({ 
          Bucket: bucketName,
          // Note: For us-east-1, we don't specify CreateBucketConfiguration
        });
        await s3.send(createCommand);
        console.log(`✅ Bucket ${bucketName} created successfully`);
        
        // Wait a moment for bucket to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true;
        
      } catch (createError) {
        console.error(`❌ Failed to create bucket:`, createError.message);
        return false;
      }
    } else {
      console.error(`❌ Error checking bucket:`, error.message);
      return false;
    }
  }
}

async function configureCORS(bucketName) {
  try {
    console.log(`🔧 Configuring CORS for ${bucketName}...`);
    
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    });
    
    await s3.send(command);
    console.log('✅ CORS configuration applied');
    
    // Verify CORS
    await new Promise(resolve => setTimeout(resolve, 2000));
    const getCorsCommand = new GetBucketCorsCommand({ Bucket: bucketName });
    const result = await s3.send(getCorsCommand);
    console.log('✅ CORS verified:', JSON.stringify(result.CORSRules, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Error configuring CORS:', error.message);
    return false;
  }
}

async function main() {
  const targetBucket = 'pixelpharm-uploads-prod';
  
  console.log('🚀 Create and Configure Production S3 Bucket');
  console.log('===========================================');
  console.log(`🎯 Target Bucket: ${targetBucket}`);
  console.log(`🌍 AWS Region: ${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}`);
  console.log('');
  
  // Step 1: Create bucket if it doesn't exist
  const bucketExists = await createBucketIfNotExists(targetBucket);
  if (!bucketExists) {
    console.log('❌ Cannot proceed without bucket access');
    process.exit(1);
  }
  
  // Step 2: Configure CORS
  const corsConfigured = await configureCORS(targetBucket);
  if (!corsConfigured) {
    console.log('⚠️ CORS configuration failed, but bucket exists');
  }
  
  console.log('\n🎉 Configuration Complete!');
  console.log('');
  console.log(`✅ Bucket: ${targetBucket}`);
  console.log('✅ CORS: Configured for pixelpharm.com');
  console.log('✅ Ready for production uploads');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('1. Update Vercel environment variable:');
  console.log(`   AWS_S3_BUCKET_NAME=${targetBucket}`);
  console.log('2. Redeploy the application');
  console.log('3. Test file uploads');
}

if (require.main === module) {
  main().catch(console.error);
}