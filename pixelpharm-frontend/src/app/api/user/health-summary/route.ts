import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { getUserHealthSummary } from "@/lib/database/user-operations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const healthSummary = await getUserHealthSummary(session.user.id);

    return NextResponse.json({
      ...healthSummary,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Error fetching health summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch health summary" },
      { status: 500 }
    );
  }
}
