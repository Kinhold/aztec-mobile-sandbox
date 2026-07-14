import { describe, expect, it } from "vitest";
import {
  assertStartupSecurity,
  getAllowedRedirectUri,
  getFrontendRedirectUrl,
  getJwtSecret,
  isCorsOriginAllowed,
  parseCorsAllowlist,
  parseOAuthRedirectAllowlist,
} from "../server/_core/security";

describe("CORS policy", () => {
  it("allows only exact configured origins", () => {
    const allowed = parseCorsAllowlist(
      "https://app.kinhold.org,http://localhost:8081",
    );

    expect(isCorsOriginAllowed("https://app.kinhold.org", allowed)).toBe(true);
    expect(isCorsOriginAllowed("http://localhost:8081", allowed)).toBe(true);
    expect(isCorsOriginAllowed("https://evil.kinhold.org", allowed)).toBe(
      false,
    );
    expect(
      isCorsOriginAllowed("https://app.kinhold.org.evil.example", allowed),
    ).toBe(false);
  });

  it("rejects origins containing paths or unsupported schemes", () => {
    expect(() => parseCorsAllowlist("https://app.kinhold.org/path")).toThrow(
      /path/,
    );
    expect(() => parseCorsAllowlist("*")).toThrow(/absolute URL/);
  });
});

describe("OAuth redirects", () => {
  it("accepts an encoded redirect only when it is exactly allowlisted", () => {
    const allowed = parseOAuthRedirectAllowlist(
      "https://app.kinhold.org/api/oauth/callback,kinhold-aztec-sandbox:///oauth/callback",
    );
    const state = Buffer.from(
      "https://app.kinhold.org/api/oauth/callback",
    ).toString("base64");

    expect(getAllowedRedirectUri(state, allowed)).toBe(
      "https://app.kinhold.org/api/oauth/callback",
    );
  });

  it("rejects unlisted and unsafe redirect URIs", () => {
    const allowed = parseOAuthRedirectAllowlist(
      "https://app.kinhold.org/api/oauth/callback",
    );
    const unlisted = Buffer.from("https://evil.example/callback").toString(
      "base64",
    );

    expect(() => getAllowedRedirectUri(unlisted, allowed)).toThrow(
      /not allowed/,
    );
    expect(() =>
      parseOAuthRedirectAllowlist("http://app.kinhold.org/callback"),
    ).toThrow(/HTTPS/);
    expect(() => parseOAuthRedirectAllowlist("javascript:alert(1)")).toThrow(
      /HTTPS/,
    );
  });

  it("allows only HTTPS or local HTTP frontend redirects", () => {
    expect(
      getFrontendRedirectUrl("https://app.kinhold.org/welcome", true),
    ).toBe("https://app.kinhold.org/welcome");
    expect(() =>
      getFrontendRedirectUrl("http://app.kinhold.org", true),
    ).toThrow(/HTTPS/);
    expect(getFrontendRedirectUrl(undefined, false)).toBe(
      "http://localhost:8081/",
    );
  });
});

describe("startup security", () => {
  it("requires a strong JWT secret in production", () => {
    expect(() => getJwtSecret({ NODE_ENV: "production" })).toThrow(/required/);
    expect(() =>
      getJwtSecret({ NODE_ENV: "production", JWT_SECRET: "too-short" }),
    ).toThrow(/32 characters/);
    expect(
      getJwtSecret({ NODE_ENV: "production", JWT_SECRET: "a".repeat(32) }),
    ).toHaveLength(32);
  });

  it("fails closed when optional capabilities are enabled without configuration", () => {
    expect(() =>
      assertStartupSecurity({
        NODE_ENV: "development",
        AUTH_ENABLED: "true",
      }),
    ).toThrow(/VITE_APP_ID/);

    expect(() =>
      assertStartupSecurity({
        NODE_ENV: "development",
        STORAGE_PROXY_ENABLED: "true",
      }),
    ).toThrow(/BUILT_IN_FORGE_API_URL/);

    expect(() =>
      assertStartupSecurity({
        NODE_ENV: "development",
        STORAGE_PROXY_ENABLED: "true",
        BUILT_IN_FORGE_API_URL: "https://forge.example",
        BUILT_IN_FORGE_API_KEY: "test-key",
      }),
    ).toThrow(/AUTH_ENABLED/);
  });

  it("allows disabled optional capabilities in development", () => {
    expect(() =>
      assertStartupSecurity({
        NODE_ENV: "development",
        AUTH_ENABLED: "false",
        STORAGE_PROXY_ENABLED: "false",
      }),
    ).not.toThrow();
  });
});
