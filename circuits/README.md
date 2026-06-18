# Noir Circuits - ZK Mobile Identity Suite

This directory contains zero-knowledge proof circuits built with the Noir language for the **ZK Mobile Identity Suite**. Each circuit is designed for privacy-preserving identity verification on mobile devices.

## Available Circuits

### Age Proof (`age_proof/`)

**Purpose:** Prove that a user is over a minimum age without revealing their exact birthdate.

**Key Features:**
- Privacy-preserving age verification
- Non-linkable proofs (random nonce prevents tracking)
- Efficient constraint system (~450 gates)
- Fast proof generation and verification
- Mobile-optimized for 6.7" viewports

**Public Inputs:**
- `min_age` — Minimum age threshold (e.g., 18, 21)
- `current_timestamp` — Current Unix timestamp
- `age_commitment` — Poseidon hash of (birthdate || nonce)

**Private Inputs:**
- `birthdate` — User's birthdate (Unix timestamp)
- `nonce` — Random 32-byte nonce for privacy

**Constraints:**
- Commitment verification: `Poseidon(birthdate || nonce) == age_commitment`
- Age threshold: `current_timestamp - birthdate >= min_age * 365.25 * 86400`
- Sanity checks: `year_2000 <= birthdate <= current_timestamp`

**Performance:**
- Constraint gates: ~450
- Proof size: ~1024 bytes
- Verification time: ~50-100ms
- Proving time: ~200-500ms

See `age_proof/AGE_PROOF.md` for complete documentation.

## Circuit Development Workflow

### 1. Compile Circuit

```bash
cd circuits/age_proof
nargo compile
```

### 2. Generate Proof

```bash
nargo prove
```

### 3. Verify Proof

```bash
nargo verify
```

## Integration with Mobile App

The circuits integrate with the mobile app through the `AztecPxeClient`:

```typescript
import { createAztecPxeClient } from '@/lib/aztec-pxe-client';

const pxeClient = createAztecPxeClient({
  rpcUrl: 'https://pxe.aztec.network',
});

// Generate age proof
const proof = await pxeClient.generateProof({
  circuit: 'age_proof',
  publicInputs: {
    min_age: 18,
    current_timestamp: Math.floor(Date.now() / 1000),
    age_commitment,
  },
  privateInputs: {
    birthdate,
    nonce,
  },
});
```

## Circuit Specifications

| Metric | Value |
|--------|-------|
| **Language** | Noir v0.30 |
| **Proving System** | Barretenberg (BN254) |
| **Hash Function** | Poseidon |
| **Constraint Gates** | ~450 |
| **Proof Size** | ~1024 bytes |
| **Verification Time** | ~50-100ms |

## Requirements

- Noir v0.30+
- Barretenberg proving system
- Node.js 18+ (for tooling)

## Deployment

### Development

Circuits are compiled and tested locally during development. Use `nargo compile` to verify syntax and constraints.

### Production

For production deployment:

1. Compile circuit: `nargo compile`
2. Generate verification key: `nargo prove --write_vk`
3. Test proof generation and verification
4. Deploy verification key to smart contract or verification service
5. Integrate with mobile app via AztecPxeClient

## Security Considerations

### Privacy Properties

- **Birthdate Privacy** — Exact birthdate is never revealed
- **Non-Linkability** — Different proofs cannot be linked to the same user (due to random nonce)
- **Replay Protection** — Proofs include current_timestamp to prevent replay attacks

### Cryptographic Assumptions

- **Poseidon Hash** — Collision-resistant hash function over BN254 field
- **Noir Constraint System** — Sound zero-knowledge proof system
- **Barretenberg Prover** — Secure proof generation and verification

## References

- [Aztec Protocol Documentation](https://docs.aztec.network)
- [Noir Language Reference](https://noir-lang.org)
- [Poseidon Hash Function](https://www.poseidon-hash.info/)
- [Zero-Knowledge Proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
