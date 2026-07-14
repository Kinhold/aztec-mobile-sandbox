import { isEnabled } from "./security";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  oAuthAllowedRedirectUris: process.env.OAUTH_ALLOWED_REDIRECT_URIS ?? "",
  oAuthFrontendRedirectUrl: process.env.OAUTH_FRONTEND_REDIRECT_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  authEnabled: isEnabled(process.env.AUTH_ENABLED),
  storageProxyEnabled: isEnabled(process.env.STORAGE_PROXY_ENABLED),
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
