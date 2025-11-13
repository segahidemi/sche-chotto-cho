import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";

type GraphQLAuthMode = NonNullable<
  NonNullable<ResourcesConfig["API"]>["GraphQL"]
>["defaultAuthMode"];

const requiredEnvVars = [
  "AMPLIFY_DATA_GRAPHQL_ENDPOINT",
  "AMPLIFY_DATA_REGION",
  "AMPLIFY_DATA_API_KEY",
] as const;

const missingEnv = requiredEnvVars.filter(
  (name) => !process.env[name] || process.env[name]?.length === 0,
);

let configured = false;

const authMode = (process.env.AMPLIFY_DATA_AUTH_MODE as GraphQLAuthMode) ?? "apiKey";

export const ensureAmplifyConfigured = () => {
  if (configured) {
    return;
  }

  if (missingEnv.length > 0) {
    throw new Error(
      `Amplify Data env vars missing: ${missingEnv.join(", ")}. ` +
        "Set them in .env.local to enable persistent storage.",
    );
  }

  const config: ResourcesConfig = {
    API: {
      GraphQL: {
        endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT!,
        region: process.env.AMPLIFY_DATA_REGION!,
        defaultAuthMode: authMode,
        apiKey: process.env.AMPLIFY_DATA_API_KEY,
      },
    },
  };

  Amplify.configure(config, { ssr: true });
  configured = true;
};

export const getAuthMode = () => authMode;
