import { NextResponse } from "next/server";
import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";

export async function GET() {
  try {
    const client = new BedrockClient({
      region: process.env.AWS_BEDROCK_REGION || "us-east-1",
    });

    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    // Filter for Anthropic models only
    const anthropicModels = response.modelSummaries?.filter(
      (model) => model.providerName === "Anthropic"
    );

    // Also get inference profiles
    const { BedrockClient: ProfileClient, ListInferenceProfilesCommand } =
      await import("@aws-sdk/client-bedrock");
    const profileClient = new ProfileClient({
      region: process.env.AWS_BEDROCK_REGION || "us-east-1",
    });

    let inferenceProfiles = [];
    try {
      const profileCommand = new ListInferenceProfilesCommand({});
      const profileResponse = await profileClient.send(profileCommand);

      inferenceProfiles =
        profileResponse.inferenceProfileSummaries?.filter(
          (profile) =>
            profile.inferenceProfileName?.includes("claude") ||
            profile.inferenceProfileName?.includes("anthropic")
        ) || [];
    } catch (profileError) {
      console.log("Could not fetch inference profiles:", profileError);
    }

    return NextResponse.json({
      success: true,
      region: process.env.AWS_BEDROCK_REGION,
      currentModelId: process.env.BEDROCK_MODEL_ID,
      anthropicModels: anthropicModels?.map((model) => ({
        modelId: model.modelId,
        modelName: model.modelName,
        providerName: model.providerName,
        responseStreamingSupported: model.responseStreamingSupported,
        inputModalities: model.inputModalities,
        outputModalities: model.outputModalities,
      })),
      inferenceProfiles: inferenceProfiles?.map((profile) => ({
        inferenceProfileName: profile.inferenceProfileName,
        inferenceProfileArn: profile.inferenceProfileArn,
        description: profile.description,
        type: profile.type,
      })),
      totalModels: response.modelSummaries?.length,
      totalProfiles: inferenceProfiles?.length,
    });
  } catch (error: any) {
    console.error("Error listing models:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorCode: error.name,
        region: process.env.AWS_BEDROCK_REGION,
        currentModelId: process.env.BEDROCK_MODEL_ID,
      },
      { status: 500 }
    );
  }
}
