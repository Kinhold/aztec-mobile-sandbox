# Kinhold Aztec Mobile Sandbox

An Expo/React Native sandbox for exploring the mobile user experience around a future Aztec proof flow. It includes an Express/tRPC development backend and an experimental JSON-RPC adapter interface.

## Current status

This is an exploratory prototype, not a production wallet or prover.

- The proof screen is a clearly labelled timing simulation. It does **not** call `generateProof`, construct a witness, compile Noir, or verify a proof.
- `lib/aztec-pxe-client.ts` describes a project-local, unverified RPC contract. No Aztec SDK dependency is installed, and compatibility with a real PXE has not been established.
- The optional health probe only shows that a configured adapter answered `pxe_healthCheck`; it does not establish Aztec compatibility.
- The circuit files are design sketches and are not compiled or tested by the pnpm test suite.
- Authentication, the legacy Manus OAuth adapter, and the storage proxy are non-product template capabilities. OAuth and storage routes are disabled by default.

Do not use this package to make privacy, proof-generation, or protocol-compatibility claims.

## Run locally

Requirements: Node.js 20+ and pnpm 9.

```bash
pnpm install
pnpm dev
```

Other useful commands:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build       # bundles the Node backend only
pnpm dev:metro   # Expo web development server
pnpm android
pnpm ios
```

`pnpm build` is not an Android, iOS, or Expo static production build.

## Optional PXE adapter probe

Set `EXPO_PUBLIC_PXE_RPC_URL` to probe an endpoint implementing this repository's experimental `pxe_healthCheck` method:

```bash
EXPO_PUBLIC_PXE_RPC_URL=https://adapter.example pnpm dev:metro
```

The button still runs only the local UI simulation. Wiring a real proof path requires choosing supported Aztec packages, implementing the current PXE API, defining trust and privacy boundaries, and adding integration tests against a pinned Aztec version.

## Backend security configuration

Copy `.env.example` to a local environment file and set only the capabilities you need.

- Production startup requires a `JWT_SECRET` of at least 32 characters.
- `CORS_ALLOWED_ORIGINS` is an exact, comma-separated origin allowlist. Requests carrying any other `Origin` are rejected. An empty list permits only clients that send no `Origin`, such as native or same-host server-to-server clients.
- `AUTH_ENABLED` defaults to false. Enabling it requires OAuth server/app configuration and an exact `OAUTH_ALLOWED_REDIRECT_URIS` list. The inherited adapter encodes the redirect URI in `state`; allowlisting prevents arbitrary redirect values but does not turn that value into a full nonce-backed OAuth CSRF state implementation.
- `OAUTH_FRONTEND_REDIRECT_URL` is server configuration, not request input, and must use HTTPS in production.
- `STORAGE_PROXY_ENABLED` defaults to false. When enabled, downloads require a valid session. The proxy does not implement per-object ownership policy, so product code should add authorization tied to stored metadata before enabling it for user data.
- Session cookies are host-only, HTTP-only, and secure in HTTPS environments.

Example web development configuration:

```dotenv
JWT_SECRET=replace-with-a-random-development-secret
CORS_ALLOWED_ORIGINS=http://localhost:8081
```

## Repository map

```text
app/(tabs)/index.tsx       proof-flow UI simulation
lib/aztec-pxe-client.ts    experimental, non-SDK JSON-RPC adapter
circuits/                  unverified Noir design sketches
server/_core/              optional Express auth/storage infrastructure
tests/                     backend configuration and route tests
```

## Before any real PXE work

1. Pin an Aztec release and install its supported SDK packages.
2. Replace the local RPC assumptions with that release's documented PXE API.
3. Decide where private inputs and witnesses are created and document what a remote service can observe.
4. Compile and test circuits with a pinned Noir toolchain.
5. Call and verify the real proof API from the UI path.
6. Add device and endpoint integration tests before changing the simulation label.
