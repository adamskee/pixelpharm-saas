import { NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { fromEnv } from "@aws-sdk/credential-providers";

export async function GET() {
  try {
    console.log("=== BEDROCK DEBUG TEST ===");

    // Step 1: Check environment variables
    const region = process.env.AWS_BEDROCK_REGION;
    const modelId = process.env.BEDROCK_MODEL_ID;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

    console.log("Environment check:");
    console.log("- Region:", region);
    console.log("- Model ID:", modelId);
    console.log("- Access Key exists:", !!accessKeyId);
    console.log("- Secret Key exists:", !!secretKey);

    if (!region || !modelId || !accessKeyId || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing environment variables",
          details: {
            region: !!region,
            modelId: !!modelId,
            accessKeyId: !!accessKeyId,
            secretKey: !!secretKey,
          },
        },
        { status: 500 }
      );
    }

    // Step 2: Test Bedrock client creation
    console.log("Creating Bedrock client...");
    const client = new BedrockRuntimeClient({
      region: region,
      credentials: fromEnv(),
    });
    console.log("✅ Bedrock client created successfully");

    // Step 3: Create a simple test command
    console.log("Creating invoke command...");
    const command = new InvokeModelCommand({
      modelId: modelId,
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 100,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: "Say 'Hello from Bedrock!' and nothing else.",
          },
        ],
      }),
      contentType: "application/json",
      accept: "application/json",
    });
    console.log("✅ Command created successfully");

    // Step 4: Test the actual invoke
    console.log("Invoking model...");
    const response = await client.send(command);
    console.log("✅ Model invoked successfully");

    // Step 5: Parse response
    console.log("Parsing response...");
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("Response body:", responseBody);

    const message = responseBody.content[0].text;
    console.log("✅ Test completed successfully");

    return NextResponse.json({
      success: true,
      message: "Bedrock integration working!",
      response: message,
      modelUsed: modelId,
      region: region,
    });
  } catch (error: any) {
    console.error("❌ Bedrock test failed:", error);

    // More detailed error information
    const errorDetails = {
      name: error.name,
      message: error.message,
      code: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      fault: error.$fault,
      stack: error.stack,
    };

    console.error("Error details:", errorDetails);

    return NextResponse.json(
      {
        success: false,
        error: "Bedrock test failed",
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
