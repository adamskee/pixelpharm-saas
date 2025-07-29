import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const biomarkerValues = await prisma.biomarkerValue.findMany({
      where: { userId },
      orderBy: { testDate: "desc" },
      take: 50,
    });

    // Transform to expected format
    const biomarkers = biomarkerValues.map((bv) => ({
      name: bv.biomarkerName,
      value: parseFloat(bv.value.toString()),
      date: bv.testDate.toISOString(),
      unit: bv.unit,
      trend: [parseFloat(bv.value.toString())], // Single point for now
    }));

    return NextResponse.json({ biomarkers });
  } catch (error) {
    console.error("Error fetching biomarker data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
