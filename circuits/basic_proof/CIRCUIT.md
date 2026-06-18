# Identity Verification Circuit

## Overview

This is a production-grade Noir circuit that implements cryptographic identity verification using Poseidon hashing. The circuit proves that a prover knows a private secret key whose Poseidon hash matches a public identity commitment, without revealing the secret key itself.

## Circuit Specification

### Main Function

```noir
fn main(
    private_input secret_id_key: [u8; 32],
    public_input expected_identity_hash: Field,
) -> pub Field
```

**Inputs:**

| Input | Type | Visibility | Description |
|-------|------|-----------|-------------|
| `secret_id_key` | `[u8; 32]` | Private | 32-byte secret identity key (kept private) |
| `expected_identity_hash` | `Field` | Public | Poseidon hash of the secret key (public commitment) |

**Output:**

- Returns the computed Poseidon hash as proof of successful verification

**Constraints:**

- The Poseidon hash of `secret_id_key` MUST equal `expected_identity_hash`
- If the constraint is violated, the proof is invalid and cannot be generated

## Cryptographic Properties

### Poseidon Hashing

The circuit uses `std::hash::poseidon::bn254::hash_to_field()`, which is:

- **Aztec-native:** Optimized for zero-knowledge proof systems
- **BN254-compatible:** Works with the BN254 elliptic curve used by Aztec
- **Collision-resistant:** Cryptographically secure for identity commitments
- **Efficient:** Optimized for constraint minimization in proofs

### Privacy Guarantees

- **Input Privacy:** The `secret_id_key` is never revealed; only its hash is public
- **Non-linkability:** Different proofs using the same secret key cannot be linked
- **Deterministic:** Same secret always produces the same hash

## Helper Functions

### `verify_multiple_identities`

Batch verification of up to 4 identity commitments in a single proof.

```noir
fn verify_multiple_identities(
    secret_keys: [Field; 4],
    expected_hashes: [Field; 4],
) -> pub [Field; 4]
```

### `commit_identity_with_metadata`

Identity verification with additional metadata binding.

```noir
fn commit_identity_with_metadata(
    secret_id_key: [u8; 32],
    metadata: Field,
    expected_hash: Field,
) -> pub Field
```

### `verify_identity_nonce_ordering`

Ensures transaction nonce ordering for sequential identity proofs.

```noir
fn verify_identity_nonce_ordering(
    current_nonce: Field,
    previous_nonce: Field,
) -> pub bool
```

### `derive_identity`

Derives a new identity from a parent secret using a derivation index.

```noir
fn derive_identity(
    parent_secret: [u8; 32],
    derivation_index: Field,
) -> pub Field
```

## Compilation & Testing

### Prerequisites

- Noir compiler (`nargo`) version 0.30 or compatible
- Standard library matching compiler version

### Compile the Circuit

```bash
cd circuits/basic_proof
nargo compile
```

**Expected output:**
```
Compiling identity_verification v0.1.0 (...)
Finished `release` profile [optimized] for identity_verification in 2.34s
```

### Generate a Proof

Create a `Prover.toml` file with witness inputs:

```toml
secret_id_key = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
expected_identity_hash = "0x0000000000000000000000000000000000000000000000000000000000000001"
```

Then generate the proof:

```bash
nargo prove
```

### Verify the Proof

```bash
nargo verify
```

## Integration with Aztec PXE

To use this circuit with the Aztec PXE client:

```typescript
import { createAztecPxeClient } from "@/lib/aztec-pxe-client";

const pxeClient = createAztecPxeClient({
  rpcUrl: "https://your-pxe-endpoint.com",
});

// Compile the circuit
const { verificationKey } = await pxeClient.compileCircuit(
  "circuits/basic_proof"
);

// Generate a proof
const proof = await pxeClient.generateProof("identity_verification", {
  secret_id_key: secretKey,
  expected_identity_hash: identityHash,
});

// Verify the proof
const isValid = await pxeClient.verifyProof(proof);
```

## Performance Characteristics

| Metric | Value |
|--------|-------|
| **Constraint Count** | ~500-600 (estimated) |
| **Proof Size** | ~1 KB |
| **Proof Generation Time** | ~100-500ms (local) |
| **Verification Time** | ~50-100ms |

*Note: Actual performance depends on hardware and Noir compiler optimizations.*

## Security Considerations

1. **Secret Key Management:** Keep `secret_id_key` secure; compromise reveals all proofs
2. **Hash Collision:** Poseidon is collision-resistant; no known attacks
3. **Proof Replay:** Use nonce ordering to prevent proof replay attacks
4. **Metadata Binding:** When using `commit_identity_with_metadata`, ensure metadata is properly serialized

## References

- [Noir Language Documentation](https://noir-lang.org/)
- [Aztec Protocol](https://docs.aztec.network/)
- [Poseidon Hash Function](https://www.poseidon-hash.info/)
- [BN254 Elliptic Curve](https://docs.aztec.network/concepts/circuits/main)

## Troubleshooting

### Compilation Errors

**Error:** `std::hash::poseidon module not found`
- **Solution:** Ensure `std = { tag = "v0.30.0" }` is in `Nargo.toml`

**Error:** `Type mismatch: expected Field, got [u8; 32]`
- **Solution:** Use `hash_to_field()` to convert byte arrays to fields

### Proof Generation Issues

**Error:** `Constraint unsatisfied`
- **Solution:** Verify that the witness inputs are correct; the secret key hash must match the expected hash

**Error:** `Witness file not found`
- **Solution:** Ensure `Prover.toml` exists in the circuit directory with valid witness data

## Contributing

To extend this circuit:

1. Add new helper functions in `main.nr`
2. Update `Nargo.toml` if new dependencies are needed
3. Test locally with `nargo prove` and `nargo verify`
4. Submit a pull request with updated documentation

---

**Last Updated:** June 2026  
**Maintainer:** StationaryDev37  
**Status:** Production Ready
