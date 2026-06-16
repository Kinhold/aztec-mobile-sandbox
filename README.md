# aztec-mobile-sandbox
## Client-Side PXE Gateway for Android

A specialized mobile client framework optimized for resource-constrained Android environments (specifically MediaTek Dimensity 6300 architectures / Moto G 2025). This repository implements a lean, asynchronous JSON-RPC connector designed to offload heavy state-proving overhead to a remote Aztec Private eXecution Environment (PXE) while executing local Noir circuit witness generation.

## ⚓ The Mobile State Bottleneck

Running full Aztec nodes or local PXE processes on hardware with 4GB RAM causes severe memory thrashing. This architecture delegates state synchronization and proof construction to a remote or cloud-hosted infrastructure, maintaining full cryptographic privacy boundaries via client-side transaction hashing before data transmission.

## 🛠️ Implementation Specs

* **Frontend Runtime:** React Native / TypeScript client optimized for 6.7" mobile viewports.
* **ZK Toolchain:** Aztec Network SDK configurations, Noir circuit compilation framework.
* **Data Transport:** Asynchronous JSON-RPC over secure WebSocket/HTTP layers to bypass browser-native overhead.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Expo CLI
- Noir compiler (for circuit development)

### Installation

```bash
# Clone the repository
git clone https://github.com/StationaryDev37/aztec-mobile-sandbox.git
cd aztec-mobile-sandbox

# Install dependencies
pnpm install

# Initialize local Noir circuit parameters
npx noir-codegen
```

### Running the App

```bash
# Start the development server
pnpm dev

# For iOS
pnpm ios

# For Android
pnpm android

# For Web
pnpm dev:metro
```

## 📁 Project Structure

```
aztec-mobile-sandbox/
├── app/                      # React Native screens and navigation
│   ├── (tabs)/              # Tab-based navigation
│   │   ├── _layout.tsx      # Tab configuration
│   │   └── index.tsx        # Home screen
│   ├── _layout.tsx          # Root layout with providers
│   └── oauth/               # OAuth callback handlers
├── circuits/                # Noir circuit templates
│   ├── basic_proof/         # Basic proof-of-knowledge circuit
│   │   ├── main.nr          # Circuit definition
│   │   └── Nargo.toml       # Circuit manifest
│   └── README.md            # Circuit documentation
├── components/              # Reusable React Native components
│   ├── screen-container.tsx # SafeArea wrapper
│   ├── themed-view.tsx      # Theme-aware view
│   └── ui/                  # UI components (icons, buttons, etc.)
├── lib/                     # Utility libraries
│   ├── aztec-pxe-client.ts  # JSON-RPC PXE client
│   ├── trpc.ts              # tRPC client setup
│   ├── utils.ts             # Helper utilities
│   └── theme-provider.tsx   # Theme context
├── hooks/                   # Custom React hooks
│   ├── use-colors.ts        # Theme colors hook
│   ├── use-auth.ts          # Authentication state
│   └── use-color-scheme.ts  # Dark/light mode detection
├── server/                  # Backend server (Node.js + Express)
│   ├── _core/               # Core server modules
│   │   ├── index.ts         # Server entry point
│   │   ├── trpc.ts          # tRPC router setup
│   │   ├── context.ts       # Request context
│   │   └── ...              # Other server utilities
│   ├── routers.ts           # tRPC route definitions
│   └── README.md            # Backend documentation
├── assets/                  # Static assets
│   ├── images/              # App icons and splash screens
│   └── fonts/               # Custom fonts
├── constants/               # Application constants
├── theme.config.js          # Tailwind color palette
├── tailwind.config.js       # Tailwind CSS configuration
├── app.config.ts            # Expo app configuration
├── package.json             # Project dependencies
└── tsconfig.json            # TypeScript configuration
```

## 🔐 Aztec PXE Client Usage

The `AztecPxeClient` provides a type-safe interface to interact with remote Aztec PXE nodes:

```typescript
import { createAztecPxeClient } from "@/lib/aztec-pxe-client";

// Initialize the client
const pxeClient = createAztecPxeClient({
  rpcUrl: "https://your-pxe-endpoint.com",
  timeout: 30000,
  retryAttempts: 3,
});

// Check PXE health
const isHealthy = await pxeClient.healthCheck();

// Get account information
const account = await pxeClient.getAccount("0x...");

// Submit a transaction
const txHash = await pxeClient.submitTransaction({
  to: "0x...",
  from: "0x...",
  functionName: "transfer",
  args: [recipient, amount],
  nonce: 1,
});

// Get transaction status
const status = await pxeClient.getTransactionStatus(txHash);

// Compile a Noir circuit
const { verificationKey } = await pxeClient.compileCircuit(
  "circuits/basic_proof"
);

// Generate a proof
const proof = await pxeClient.generateProof("basic_proof", {
  private_input: 5n,
  public_input: 25n,
});

// Verify the proof
const isValid = await pxeClient.verifyProof(proof);
```

## 📱 Noir Circuit Development

Circuits are stored in the `/circuits` directory. Each circuit is a Noir program that can be compiled and used to generate zero-knowledge proofs.

### Creating a New Circuit

```bash
mkdir circuits/my_circuit
cd circuits/my_circuit
```

Create `main.nr`:

```noir
fn main(private_input: Field, public_input: Field) -> pub Field {
    let result = private_input * private_input;
    assert(result == public_input);
    result
}
```

Create `Nargo.toml`:

```toml
[package]
name = "my_circuit"
type = "bin"
authors = ["Your Name"]
compiler_version = "0.30"

[dependencies]
std = { tag = "v0.30.0" }
```

Compile and test:

```bash
nargo compile
nargo prove
nargo verify
```

For detailed circuit documentation, see [circuits/README.md](./circuits/README.md).

## 🔄 Architecture Overview

### Client-Side (Mobile)

1. **Transaction Preparation:** User initiates a transaction on the mobile client.
2. **Witness Generation:** Local Noir circuit compilation generates witness data.
3. **Client-Side Hashing:** Transaction is hashed locally before transmission.
4. **RPC Request:** JSON-RPC request is sent to remote PXE with hashed transaction.

### Server-Side (Remote PXE)

1. **State Synchronization:** PXE maintains current blockchain state.
2. **Proof Construction:** Heavy cryptographic proof generation occurs remotely.
3. **Verification:** Proofs are verified against the Aztec protocol rules.
4. **Response:** Proof and status are returned to the client.

### Privacy Guarantees

- **Client-Side Hashing:** Sensitive transaction data is hashed locally before transmission.
- **End-to-End Encryption:** All communication uses TLS/HTTPS.
- **No State Leakage:** The remote PXE never receives unencrypted transaction details.
- **Cryptographic Proofs:** Zero-knowledge proofs ensure privacy without revealing inputs.

## 🛡️ Security Considerations

1. **API Key Management:** Store PXE endpoint credentials in environment variables (never hardcode).
2. **TLS Verification:** Always use HTTPS for PXE communication in production.
3. **Retry Logic:** Built-in exponential backoff prevents brute-force attacks.
4. **Timeout Handling:** Requests timeout gracefully to prevent hanging connections.
5. **Circuit Validation:** Always verify circuit outputs before submitting transactions.

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Generate coverage report
pnpm test --coverage
```

## 📦 Dependencies

### Core

- **React Native 0.81:** Cross-platform mobile framework
- **Expo 54:** Managed React Native platform
- **TypeScript 5.9:** Static type checking
- **React 19:** UI library

### Styling

- **NativeWind 4:** Tailwind CSS for React Native
- **Tailwind CSS 3.4:** Utility-first CSS framework

### State & Data

- **TanStack Query 5:** Server state management
- **tRPC 11:** End-to-end typesafe APIs
- **Drizzle ORM 0.44:** TypeScript SQL query builder
- **AsyncStorage:** Local data persistence

### Cryptography & ZK

- **Aztec SDK:** Aztec protocol integration
- **Noir:** Zero-knowledge circuit language
- **Barretenberg:** Proving system

### Utilities

- **Axios:** HTTP client
- **Zod:** TypeScript-first schema validation
- **clsx & tailwind-merge:** Class name utilities

## 🚀 Deployment

### Development

```bash
pnpm dev
```

The app runs on `http://localhost:8081` with hot module reloading.

### Production Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for Web
pnpm build
```

See `server/README.md` for backend deployment instructions.

## 📚 Resources

- [Aztec Protocol Documentation](https://docs.aztec.network/)
- [Noir Language Guide](https://noir-lang.org/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

## 👤 Author

**Charles Lee** (StationaryDev37 → StationaryDev38)  
ZK Architect specializing in mobile-first zero-knowledge privacy layers and asynchronous client networks.

---

**Commit clean code, track your state transformations, and verify your inputs locally.** 🦐
