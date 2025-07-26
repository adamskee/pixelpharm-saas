import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { getUserBiomarkers } from "@/lib/database/user-operations";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const biomarkerNames = searchParams.get("biomarkers")?.split(",");
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    const biomarkers = await getUserBiomarkers(session.user.id, {
      limit,
      biomarkerNames,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({
      biomarkers,
      count: biomarkers.length,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Error fetching user biomarkers:", error);
    return NextResponse.json(
      { error: "Failed to fetch biomarkers" },
      { status: 500 }
    );
  }
}
