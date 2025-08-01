// PDF conversion disabled - endpoint returns error
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "PDF processing has been disabled",
      details: "Please upload image files (PNG, JPEG) instead of PDFs for processing.",
    },
    { status: 501 }
  );
}
