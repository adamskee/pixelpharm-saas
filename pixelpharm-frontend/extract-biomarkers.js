// extract-biomarkers.js
// Extract biomarkers from JSON in BloodTestResult and create individual BiomarkerValue records

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function extractBiomarkersToIndividualRecords() {
  console.log("🔧 === EXTRACTING BIOMARKERS TO INDIVIDUAL RECORDS ===");

  try {
    const userId = "117355393393976327622";

    // Get all blood test results with biomarkers JSON
    const bloodTests = await prisma.bloodTestResult.findMany({
      where: { userId },
      orderBy: { testDate: "desc" },
    });

    console.log(`🩸 Found ${bloodTests.length} blood test results to process`);

    let totalExtracted = 0;

    for (const bloodTest of bloodTests) {
      console.log(`\n📊 Processing blood test: ${bloodTest.resultId}`);
      console.log(`   Test Date: ${bloodTest.testDate}`);
      console.log(`   Lab: ${bloodTest.labName}`);

      if (bloodTest.biomarkers && Array.isArray(bloodTest.biomarkers)) {
        console.log(`   Biomarkers in JSON: ${bloodTest.biomarkers.length}`);

        for (const biomarker of bloodTest.biomarkers) {
          console.log(
            `     Processing: ${biomarker.name} = ${biomarker.value} ${biomarker.unit}`
          );

          try {
            // Check if this biomarker value already exists
            const existingValue = await prisma.biomarkerValue.findFirst({
              where: {
                userId,
                resultId: bloodTest.resultId,
                biomarkerName: biomarker.name,
                testDate: bloodTest.testDate,
              },
            });

            if (existingValue) {
              console.log(`       ⚠️  Already exists, skipping`);
              continue;
            }

            // Create individual biomarker value record
            const biomarkerValue = await prisma.biomarkerValue.create({
              data: {
                userId: userId,
                resultId: bloodTest.resultId,
                biomarkerName: biomarker.name,
                value: parseFloat(biomarker.value) || 0,
                unit: biomarker.unit || "",
                isAbnormal: biomarker.isAbnormal || false,
                testDate: bloodTest.testDate,
                referenceRange: biomarker.referenceRange || null,
                notes: biomarker.notes || null,
              },
            });

            console.log(
              `       ✅ Created biomarker value: ${biomarkerValue.valueId}`
            );
            totalExtracted++;
          } catch (error) {
            console.error(
              `       ❌ Error creating biomarker value for ${biomarker.name}:`,
              error.message
            );
          }
        }
      } else {
        console.log(`   ⚠️  No biomarkers array found`);
      }
    }

    console.log(`\n🎯 === EXTRACTION COMPLETE ===`);
    console.log(`✅ Total biomarker values extracted: ${totalExtracted}`);

    // Verify the results
    const totalBiomarkerValues = await prisma.biomarkerValue.count({
      where: { userId },
    });

    console.log(
      `📊 Total biomarker values now in database: ${totalBiomarkerValues}`
    );

    // Show sample of extracted data
    const sampleBiomarkers = await prisma.biomarkerValue.findMany({
      where: { userId },
      orderBy: { testDate: "desc" },
      take: 5,
    });

    console.log(`\n💊 Sample extracted biomarkers:`);
    sampleBiomarkers.forEach((bm, i) => {
      console.log(
        `   ${i + 1}. ${bm.biomarkerName}: ${bm.value} ${bm.unit} (${
          bm.testDate
        })`
      );
    });
  } catch (error) {
    console.error("❌ Extraction error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

extractBiomarkersToIndividualRecords();
