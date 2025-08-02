/**
 * Diagnose Production Credentials Issue
 * This helps understand why production STS credentials can't access the bucket
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const sts = new STSClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function diagnoseCredentials() {
  try {
    console.log('🔍 Diagnosing AWS credentials...');
    
    // Get current identity
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    console.log('📋 Local AWS Identity:');
    console.log('   Account:', identity.Account);
    console.log('   User ID:', identity.UserId);
    console.log('   ARN:', identity.Arn);
    console.log('');
    
    // Analyze the production credential pattern
    console.log('🔍 Production vs Local Credential Analysis:');
    console.log('   Local Credential: AKIAWX2IFXP6HMEDRBF6 (IAM User)');
    console.log('   Production Credential: ASIA4B3TGULNMDD5M67L (STS Temporary)');
    console.log('   Account ID (from local): ', identity.Account);
    console.log('');
    
    if (identity.Account !== '463470967804') {
      console.log('⚠️  WARNING: Account mismatch!');
      console.log(`   Expected: 463470967804`);
      console.log(`   Actual: ${identity.Account}`);
      console.log('   This may be why production can\'t access the bucket.');
      console.log('');
    }
    
    return identity;
  } catch (error) {
    console.error('❌ Error getting caller identity:', error.message);
    return null;
  }
}

async function createCrossAccountPolicy(bucketName, accountId) {
  const crossAccountPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`
      },
      {
        Sid: 'AllowCurrentAccount',
        Effect: 'Allow',
        Principal: {
          AWS: `arn:aws:iam::${accountId}:root`
        },
        Action: [
          's3:PutObject',
          's3:PutObjectAcl',
          's3:DeleteObject',
          's3:GetObject'
        ],
        Resource: `arn:aws:s3:::${bucketName}/*`
      },
      {
        Sid: 'AllowVercelIntegration',
        Effect: 'Allow',
        Principal: '*',
        Action: [
          's3:PutObject',
          's3:PutObjectAcl'
        ],
        Resource: `arn:aws:s3:::${bucketName}/*`,
        Condition: {
          StringLike: {
            'aws:userid': [
              'ASIA*:*',  // Any STS temporary credentials
              `AIDACKCEVSQ6C2EXAMPLE:*`  // IAM user pattern
            ]
          }
        }
      },
      {
        Sid: 'AllowAnyAuthenticated',
        Effect: 'Allow',
        Principal: '*',
        Action: [
          's3:PutObject',
          's3:PutObjectAcl'
        ],
        Resource: `arn:aws:s3:::${bucketName}/*`
      }
    ]
  };
  
  console.log('📝 Recommended Cross-Account Policy:');
  console.log(JSON.stringify(crossAccountPolicy, null, 2));
  
  return crossAccountPolicy;
}

async function main() {
  const bucketName = 'pixelpharm-uploads-prod';
  
  console.log('🚀 Diagnose Production Credentials Issue');
  console.log('======================================');
  console.log('');
  
  // Diagnose credentials
  const identity = await diagnoseCredentials();
  
  if (!identity) {
    console.log('❌ Cannot proceed without credential information');
    process.exit(1);
  }
  
  // Create cross-account policy
  await createCrossAccountPolicy(bucketName, identity.Account);
  
  console.log('');
  console.log('🔍 Possible Issues and Solutions:');
  console.log('');
  console.log('1. **Different AWS Accounts**:');
  console.log('   - Production may be using Vercel\'s AWS account');
  console.log('   - Solution: Use Vercel\'s built-in S3 integration');
  console.log('');
  console.log('2. **STS Token Restrictions**:');
  console.log('   - Temporary credentials have limited permissions');
  console.log('   - Solution: Configure IAM role with S3 permissions');
  console.log('');
  console.log('3. **IAM Role Missing**:');
  console.log('   - Production environment needs explicit IAM role');
  console.log('   - Solution: Set up Vercel AWS integration properly');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('1. Check Vercel project settings > Environment Variables');
  console.log('2. Verify AWS integration in Vercel dashboard');
  console.log('3. Consider using Vercel\'s native storage solutions');
  console.log('4. Or configure cross-account bucket access');
}

if (require.main === module) {
  main().catch(console.error);
}