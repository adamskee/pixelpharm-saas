// Debug script to check body composition data in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugBodyComposition() {
  try {
    console.log('🏋️ Checking body composition data in database...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: { userId: true, email: true, firstName: true, lastName: true }
    });

    console.log(`👥 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.userId}: ${user.email} (${user.firstName} ${user.lastName})`);
    });
    console.log('');

    // Check file uploads with body composition type
    const bodyCompositionUploads = await prisma.fileUpload.findMany({
      where: { uploadType: 'BODY_COMPOSITION' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📁 Found ${bodyCompositionUploads.length} body composition uploads:`);
    bodyCompositionUploads.forEach((upload, i) => {
      console.log(`  ${i + 1}. ${upload.originalFilename} (${upload.userId})`);
      console.log(`     Upload ID: ${upload.uploadId}`);
      console.log(`     File Key: ${upload.fileKey}`);
      console.log(`     Status: ${upload.uploadStatus}`);
      console.log(`     Created: ${upload.createdAt.toISOString()}`);
      console.log('');
    });

    // Check body composition results
    const bodyCompositionResults = await prisma.bodyCompositionResult.findMany({
      orderBy: { testDate: 'desc' },
      take: 10
    });

    console.log(`🏋️ Found ${bodyCompositionResults.length} body composition results:`);
    bodyCompositionResults.forEach((result, i) => {
      console.log(`  ${i + 1}. User: ${result.userId}`);
      console.log(`     Upload ID: ${result.uploadId}`);
      console.log(`     Test Date: ${result.testDate.toISOString()}`);
      console.log(`     Weight: ${result.totalWeight} kg`);
      console.log(`     Body Fat: ${result.bodyFatPercentage}%`);
      console.log(`     Muscle Mass: ${result.skeletalMuscleMass} kg`);
      console.log(`     BMR: ${result.bmr} kcal`);
      console.log(`     Visceral Fat: ${result.visceralFatLevel}`);
      
      if (result.rawData) {
        console.log(`     Raw Data Keys: ${Object.keys(result.rawData)}`);
        if (result.rawData.bodyComposition) {
          console.log(`     Body Composition Keys: ${Object.keys(result.rawData.bodyComposition)}`);
        }
      } else {
        console.log(`     No raw data available`);
      }
      console.log('');
    });

    // Check AI processing results
    const aiResults = await prisma.aiProcessingResult.findMany({
      where: { processingType: 'HEALTH_ANALYSIS' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`🧠 Found ${aiResults.length} AI processing results:`);
    aiResults.forEach((result, i) => {
      console.log(`  ${i + 1}. User: ${result.userId}`);
      console.log(`     Upload ID: ${result.uploadId}`);
      console.log(`     Status: ${result.processingStatus}`);
      console.log(`     Confidence: ${result.confidenceScore}`);
      console.log(`     Created: ${result.createdAt.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking body composition data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBodyComposition();