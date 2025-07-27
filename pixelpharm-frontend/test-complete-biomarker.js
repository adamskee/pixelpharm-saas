// test-biomarker-storage.js - Test the complete biomarker storage workflow

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test data based on your console logs
const testUserId = '117355393393976327622';
const testUploadId = 'test-upload-' + Date.now();
const testBiomarkers = [
  {name: 'AST', value: '27', unit: 'U/L', rawText: '(10-40) ast 27 u/l'},
  {name: 'ALT', value: '24', unit: 'U/L', rawText: '(5-40) alt 24 u/l'},
  {name: 'Total Cholesterol', value: '5.8', unit: 'mmol/L', rawText: '(23-39) total cholesterol 5.8 h mmol/l'},
  {name: 'Glucose', value: '5.1', unit: 'mmol/L', rawText: '(3.5-5.5) glucose fasting 5.1 mmol/l'},
  {name: 'Creatinine', value: '79', unit: 'umol/L', rawText: '(60-110) creatinine 79 umol/l'}
];

async function testBiomarkerStorage() {
  console.log('🧪 Testing complete biomarker storage workflow...');
  
  try {
    // Step 1: Call the storage API directly
    console.log('1. Testing storage API...');
    
    const storageRequest = {
      userId: testUserId,
      uploadId: testUploadId,
      biomarkers: testBiomarkers,
      testDate: '23/02/2024',
      labName: 'ClinicPath Laboratories'
    };

    console.log('📤 Sending storage request:', {
      userId: storageRequest.userId,
      uploadId: storageRequest.uploadId,
      biomarkersCount: storageRequest.biomarkers.length,
      testDate: storageRequest.testDate
    });

    // Simulate the storage API logic
    console.log('💾 === SIMULATING STORAGE API ===');
    
    // Check if user exists
    console.log('🔍 Checking if user exists...');
    let user = await prisma.user.findUnique({
      where: { userId: testUserId }
    });

    if (!user) {
      console.log('⚠️ User not found, creating demo user...');
      user = await prisma.user.create({
        data: {
          userId: testUserId,
          email: `user-${testUserId}@demo.com`,
          name: `Test User ${testUserId.slice(-4)}`,
          provider: 'demo'
        }
      });
      console.log('✅ Demo user created:', user.userId);
    } else {
      console.log('✅ User already exists:', user.userId);
    }

    // Check/create upload record
    console.log('🔍 Checking if upload exists...');
    let upload = await prisma.fileUpload.findUnique({
      where: { uploadId: testUploadId }
    });

    if (!upload) {
      console.log('⚠️ Upload not found, creating upload record...');
      upload = await prisma.fileUpload.create({
        data: {
          uploadId: testUploadId,
          userId: testUserId,
          fileName: 'test-blood-report.pdf',
          fileKey: `uploads/${testUserId}/BLOOD_TESTS/test.pdf`,
          uploadType: 'BLOOD_TESTS',
          status: 'PROCESSED'
        }
      });
      console.log('✅ Upload record created:', upload.uploadId);
    } else {
      console.log('✅ Upload already exists:', upload.uploadId);
    }

    // Create BloodTestResult
    console.log('🩸 Creating BloodTestResult...');
    const testDate = new Date('2024-02-23');
    const bloodTestResult = await prisma.bloodTestResult.create({
      data: {
        userId: testUserId,
        uploadId: testUploadId,
        testDate: testDate,
        labName: 'ClinicPath Laboratories',
        biomarkers: testBiomarkers
      }
    });
    console.log('✅ BloodTestResult created:', bloodTestResult.resultId);

    // Create BiomarkerValue records
    console.log(`💾 Creating ${testBiomarkers.length} biomarker values...`);
    let successCount = 0;
    
    for (let i = 0; i < testBiomarkers.length; i++) {
      const biomarker = testBiomarkers[i];
      console.log(`💾 Processing biomarker ${i + 1}/${testBiomarkers.length}: ${biomarker.name} = ${biomarker.value}`);

      try {
        const numericValue = parseFloat(biomarker.value);
        if (isNaN(numericValue)) {
          console.log(`⚠️ Skipping biomarker: Invalid numeric value "${biomarker.value}"`);
          continue;
        }

        const biomarkerValue = await prisma.biomarkerValue.create({
          data: {
            userId: testUserId,
            resultId: bloodTestResult.resultId,
            biomarkerName: biomarker.name,
            value: numericValue,
            unit: biomarker.unit,
            isAbnormal: false, // Simple default
            testDate: testDate
          }
        });

        successCount++;
        console.log(`✅ Successfully stored: ${biomarker.name} (ID: ${biomarkerValue.valueId})`);

      } catch (error) {
        console.log(`❌ Failed to store biomarker ${biomarker.name}:`, error.message);
      }
    }

    console.log(`📊 Storage complete: ${successCount}/${testBiomarkers.length} biomarkers stored`);

    // Step 2: Verify storage by querying
    console.log('\n2. Verifying stored data...');
    
    const storedBiomarkers = await prisma.biomarkerValue.findMany({
      where: { userId: testUserId },
      include: {
        result: {
          select: {
            testDate: true,
            labName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${storedBiomarkers.length} biomarkers for user ${testUserId}`);
    
    if (storedBiomarkers.length > 0) {
      console.log('📋 Sample biomarkers:');
      storedBiomarkers.slice(0, 3).forEach((bm, idx) => {
        console.log(`   ${idx + 1}. ${bm.biomarkerName}: ${bm.value} ${bm.unit} (${bm.result.testDate})`);
      });
    }

    // Step 3: Test dashboard query
    console.log('\n3. Testing dashboard data query...');
    
    const dashboardData = await prisma.user.findUnique({
      where: { userId: testUserId },
      include: {
        uploads: {
          take: 5,
          orderBy: { cre