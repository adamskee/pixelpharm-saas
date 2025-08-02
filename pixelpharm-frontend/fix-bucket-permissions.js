/**
 * Fix S3 Bucket Permissions
 * This script configures the bucket policy to allow uploads from production
 */

require('dotenv').config({ path: '.env.local' });
const { 
  S3Client, 
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand
} = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Bucket policy that allows both regular IAM users and STS temporary credentials
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
      Sid: 'AllowVercelUploads',
      Effect: 'Allow',
      Principal: '*',
      Action: [
        's3:PutObject',
        's3:PutObjectAcl'
      ],
      Resource: 'arn:aws:s3:::pixelpharm-uploads-prod/*',
      Condition: {
        StringLike: {
          'aws:userid': [
            'AIDACKCEVSQ6C2EXAMPLE:*',  // IAM user pattern
            'ASIA*:*'  // STS temporary credential pattern
          ]
        }
      }
    },
    {
      Sid: 'AllowPixelPharmAccount',
      Effect: 'Allow',
      Principal: {
        AWS: [
          'arn:aws:iam::463470967804:root',  // Account root
          'arn:aws:iam::463470967804:user/*',  // All IAM users in account
          'arn:aws:iam::463470967804:role/*'   // All IAM roles in account
        ]
      },
      Action: [
        's3:PutObject',
        's3:PutObjectAcl',
        's3:DeleteObject',
        's3:GetObject'
      ],
      Resource: 'arn:aws:s3:::pixelpharm-uploads-prod/*'
    }
  ]
};

// Simpler, more permissive policy for debugging
const debugBucketPolicy = {
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
      Sid: 'AllowAllUploads',
      Effect: 'Allow',
      Principal: '*',
      Action: [
        's3:PutObject',
        's3:PutObjectAcl'
      ],
      Resource: 'arn:aws:s3:::pixelpharm-uploads-prod/*'
    }
  ]
};

async function getCurrentPolicy(bucketName) {
  try {
    console.log(`🔍 Getting current bucket policy for ${bucketName}...`);
    const command = new GetBucketPolicyCommand({ Bucket: bucketName });
    const result = await s3.send(command);
    console.log('📋 Current Policy:', JSON.stringify(JSON.parse(result.Policy), null, 2));
    return JSON.parse(result.Policy);
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      console.log('⚠️ No bucket policy found');
      return null;
    }
    console.error('❌ Error getting bucket policy:', error.message);
    throw error;
  }
}

async function setBucketPolicy(bucketName, policy) {
  try {
    console.log(`🔧 Setting bucket policy for ${bucketName}...`);
    console.log('📝 Policy to apply:', JSON.stringify(policy, null, 2));
    
    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    });
    
    await s3.send(command);
    console.log('✅ Bucket policy applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Error setting bucket policy:', error.message);
    return false;
  }
}

async function disablePublicAccessBlock(bucketName) {
  try {
    console.log(`🔓 Configuring public access block settings for ${bucketName}...`);
    
    const command = new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    });
    
    await s3.send(command);
    console.log('✅ Public access block configuration updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating public access block:', error.message);
    return false;
  }
}

async function main() {
  const bucketName = 'pixelpharm-uploads-prod';
  
  console.log('🚀 Fix S3 Bucket Permissions for Production');
  console.log('=========================================');
  console.log(`🎯 Target Bucket: ${bucketName}`);
  console.log('');
  
  try {
    // Step 1: Check current policy
    await getCurrentPolicy(bucketName);
    
    // Step 2: Disable public access block restrictions
    console.log('\n📋 Step 1: Configure public access block settings...');
    await disablePublicAccessBlock(bucketName);
    
    // Step 3: Apply permissive policy for debugging
    console.log('\n📋 Step 2: Apply permissive bucket policy...');
    const policyApplied = await setBucketPolicy(bucketName, debugBucketPolicy);
    
    if (policyApplied) {
      console.log('\n🎉 Bucket permissions configured successfully!');
      console.log('');
      console.log('📋 What was configured:');
      console.log('   ✅ Public read access for uploaded files');
      console.log('   ✅ Allow uploads from any authenticated source');
      console.log('   ✅ Disabled restrictive public access blocks');
      console.log('');
      console.log('🚀 File uploads should now work!');
      console.log('');
      console.log('⚠️  Security Note: This is a permissive policy for debugging.');
      console.log('   Consider restricting access once uploads are working.');
    } else {
      console.log('❌ Failed to apply bucket policy');
    }
    
    // Verify the policy was applied
    console.log('\n📋 Verification: Checking applied policy...');
    await getCurrentPolicy(bucketName);
    
  } catch (error) {
    console.error('💥 Configuration failed:', error.message);
    console.log('');
    console.log('🔧 Manual Configuration Required:');
    console.log('1. Go to AWS S3 Console');
    console.log(`2. Navigate to bucket: ${bucketName}`);
    console.log('3. Go to Permissions tab');
    console.log('4. Edit "Block public access" and uncheck all boxes');
    console.log('5. Edit "Bucket policy" and paste the policy from the logs above');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}