type Environment = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const MIN_PRODUCTION_SECRET_LENGTH = 32;

export function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function parseUrl(value: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be an absolute URL`);
  }

  if (url.username || url.password) {
    throw new Error(`${label} must not contain credentials`);
  }

  return url;
}

function normalizeOrigin(value: string): string {
  const url = parseUrl(value.trim(), "CORS origin");
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("CORS origin must use http or https");
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("CORS origin must not contain a path, query, or fragment");
  }
  return url.origin;
}

export function parseCorsAllowlist(
  value: string | undefined,
): ReadonlySet<string> {
  if (!value?.trim()) return new Set();
  return new Set(
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normalizeOrigin),
  );
}

export function isCorsOriginAllowed(
  origin: string,
  allowedOrigins: ReadonlySet<string>,
): boolean {
  try {
    return allowedOrigins.has(normalizeOrigin(origin));
  } catch {
    return false;
  }
}

function normalizeRedirectUri(value: string): string {
  const url = parseUrl(value.trim(), "OAuth redirect URI");
  const isSecureWeb = url.protocol === "https:";
  const isLocalHttp = url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
  const isAppLink =
    /^[a-z][a-z0-9+.-]*:$/.test(url.protocol) &&
    !["http:", "https:", "javascript:", "data:"].includes(url.protocol);

  if (!isSecureWeb && !isLocalHttp && !isAppLink) {
    throw new Error(
      "OAuth redirect URI must use HTTPS, local HTTP, or an application scheme",
    );
  }

  return url.toString();
}

export function parseOAuthRedirectAllowlist(
  value: string | undefined,
): ReadonlySet<string> {
  if (!value?.trim()) return new Set();
  return new Set(
    value
      .split(",")
      .map((uri) => uri.trim())
      .filter(Boolean)
      .map(normalizeRedirectUri),
  );
}

function decodeBase64State(state: string): string {
  if (!state || state.length > 4096 || !/^[A-Za-z0-9+/=_-]+$/.test(state)) {
    throw new Error("OAuth state is malformed");
  }

  try {
    return Buffer.from(state, "base64").toString("utf8");
  } catch {
    throw new Error("OAuth state is malformed");
  }
}

export function getAllowedRedirectUri(
  state: string,
  allowedRedirectUris: ReadonlySet<string>,
): string {
  if (allowedRedirectUris.size === 0) {
    throw new Error("OAuth redirect allowlist is not configured");
  }

  const redirectUri = normalizeRedirectUri(decodeBase64State(state));
  if (!allowedRedirectUris.has(redirectUri)) {
    throw new Error("OAuth redirect URI is not allowed");
  }

  return redirectUri;
}

export function getFrontendRedirectUrl(
  value: string | undefined,
  isProduction: boolean,
): string {
  const candidate =
    value?.trim() || (isProduction ? "" : "http://localhost:8081");
  if (!candidate) {
    throw new Error(
      "OAUTH_FRONTEND_REDIRECT_URL is required when OAuth is enabled",
    );
  }

  const url = parseUrl(candidate, "OAuth frontend redirect URL");
  const isLocalHttp = url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error("OAuth frontend redirect URL must use HTTPS or local HTTP");
  }
  if (url.hash) {
    throw new Error("OAuth frontend redirect URL must not contain a fragment");
  }

  return url.toString();
}

export function getJwtSecret(env: Environment = process.env): string {
  const secret = env.JWT_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error("JWT_SECRET is required before session tokens can be used");
  }
  if (
    env.NODE_ENV === "production" &&
    secret.length < MIN_PRODUCTION_SECRET_LENGTH
  ) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production`,
    );
  }
  return secret;
}

export function assertStartupSecurity(env: Environment = process.env): void {
  if (env.NODE_ENV === "production") {
    getJwtSecret(env);
  }

  parseCorsAllowlist(env.CORS_ALLOWED_ORIGINS);

  if (isEnabled(env.AUTH_ENABLED)) {
    if (!env.VITE_APP_ID?.trim() || !env.OAUTH_SERVER_URL?.trim()) {
      throw new Error(
        "VITE_APP_ID and OAUTH_SERVER_URL are required when AUTH_ENABLED=true",
      );
    }
    getJwtSecret(env);
    if (
      parseOAuthRedirectAllowlist(env.OAUTH_ALLOWED_REDIRECT_URIS).size === 0
    ) {
      throw new Error(
        "OAUTH_ALLOWED_REDIRECT_URIS is required when AUTH_ENABLED=true",
      );
    }
    getFrontendRedirectUrl(
      env.OAUTH_FRONTEND_REDIRECT_URL,
      env.NODE_ENV === "production",
    );
  }

  if (
    isEnabled(env.STORAGE_PROXY_ENABLED) &&
    (!env.BUILT_IN_FORGE_API_URL?.trim() || !env.BUILT_IN_FORGE_API_KEY?.trim())
  ) {
    throw new Error(
      "BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY are required when STORAGE_PROXY_ENABLED=true",
    );
  }
  if (isEnabled(env.STORAGE_PROXY_ENABLED) && !isEnabled(env.AUTH_ENABLED)) {
    throw new Error(
      "AUTH_ENABLED=true is required when STORAGE_PROXY_ENABLED=true",
    );
  }
}
