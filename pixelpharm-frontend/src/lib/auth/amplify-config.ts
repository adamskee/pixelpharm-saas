import { Amplify } from "aws-amplify";

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID!,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code",
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
      },
    },
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
