import { Amplify } from "aws-amplify";

// Debug: Log environment variables
console.log("Environment variables:");
console.log("NEXT_PUBLIC_AWS_REGION:", process.env.NEXT_PUBLIC_AWS_REGION);
console.log(
  "NEXT_PUBLIC_AWS_USER_POOL_ID:",
  process.env.NEXT_PUBLIC_AWS_USER_POOL_ID
);
console.log(
  "NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID:",
  process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID
);

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID!,
      region: process.env.NEXT_PUBLIC_AWS_REGION!,
    },
  },
};

// Only configure if we have the required values
if (
  process.env.NEXT_PUBLIC_AWS_USER_POOL_ID &&
  process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID
) {
  Amplify.configure(amplifyConfig);
  console.log("✅ Amplify configured successfully");
  console.log("Config:", amplifyConfig);
} else {
  console.error(
    "❌ Missing AWS Cognito configuration. Please check your .env.local file."
  );
}

export default amplifyConfig;
