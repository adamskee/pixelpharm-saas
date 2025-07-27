// File: test-biomarker-storage.js
// Simplified test that creates all required relationships

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testBiomarkerStorage() {
  try {
    console.log(
      "🧪 Testing biomarker storage with all required relationships..."
    );

    const userId = "117355393393976327622";

    // Step 1: Ensure user exists
    console.log("1. Ensuring user exists...");
    await prisma.user.upsert({
      where: { userId: userId },
      update: {},
      create: {
        userId: userId,
        email: `${userId}@demo.com`,
        firstName: "Test",
        lastName: "User",
      },
    });
    console.log("✅ User ensured");

    // Step 2: Create FileUpload first (required for BloodTestResult)
    console.log("2. Creating FileUpload...");
    const fileUpload = await prisma.fileUpload.create({
      data: {
        userId: userId,
        fileKey: "test/biomarker-test.pdf",
        originalFilename: "biomarker-test.pdf",
        fileType: "application/pdf",
        uploadType: "BLOOD_TESTS",
        fileSize: 1024,
        uploadStatus: "UPLOADED",
        user: {
          connect: { userId: userId },
        },
      },
    });
    console.log("✅ FileUpload created:", fileUpload.uploadId);

    // Step 3: Create BloodTestResult linked to Upload
    console.log("3. Creating BloodTestResult...");
    const bloodTestResult = await prisma.bloodTestResult.create({
      data: {
        userId: userId,
        uploadId: fileUpload.uploadId,
        testDate: new Date(),
        labName: "Test Lab",
        biomarkers: [{ name: "Test Cholesterol", value: "200", unit: "mg/dL" }],
        user: {
          connect: { userId: userId },
        },
        upload: {
          connect: { uploadId: fileUpload.uploadId },
        },
      },
    });
    console.log("✅ BloodTestResult created:", bloodTestResult.resultId);

    // Step 4: Create BiomarkerValue linked to BloodTestResult
    console.log("4. Creating BiomarkerValue...");
    const biomarkerValue = await prisma.biomarkerValue.create({
      data: {
        userId: userId,
        resultId: bloodTestResult.resultId,
        biomarkerName: "Test Cholesterol",
        value: 200.0, // Decimal value
        unit: "mg/dL",
        referenceRange: "< 200",
        isAbnormal: false,
        testDate: new Date(),
        user: {
          connect: { userId: userId },
        },
        result: {
          connect: { resultId: bloodTestResult.resultId },
        },
      },
    });

    console.log("✅ SUCCESS! Complete biomarker storage test passed!");
    console.log("✅ BiomarkerValue created:", {
      id: biomarkerValue.valueId,
      name: biomarkerValue.biomarkerName,
      value: biomarkerValue.value.toString(),
      unit: biomarkerValue.unit,
      resultId: biomarkerValue.resultId,
    });

    // Step 5: Test retrieval to verify everything works
    console.log("5. Testing biomarker retrieval...");
    const retrievedBiomarkers = await prisma.biomarkerValue.findMany({
      where: { userId: userId },
      include: {
        result: {
          include: {
            upload: true,
          },
        },
      },
    });

    console.log(`✅ Found ${retrievedBiomarkers.length} biomarkers for user`);
    retrievedBiomarkers.forEach((bm, index) => {
      console.log(
        `  ${index + 1}. ${bm.biomarkerName}: ${bm.value} ${bm.unit} (Lab: ${
          bm.result.labName
        }, File: ${bm.result.upload.originalFilename})`
      );
    });

    // Step 6: Clean up test data
    console.log("6. Cleaning up test data...");
    await prisma.biomarkerValue.delete({
      where: { valueId: biomarkerValue.valueId },
    });
    await prisma.bloodTestResult.delete({
      where: { resultId: bloodTestResult.resultId },
    });
    await prisma.fileUpload.delete({
      where: { uploadId: fileUpload.uploadId },
    });
    console.log("✅ Test cleanup completed");
  } catch (error) {
    console.error("❌ ERROR in biomarker storage test:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBiomarkerStorage();
