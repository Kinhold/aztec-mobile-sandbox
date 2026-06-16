# Aztec Mobile Sandbox - Noir Circuits

This directory contains Noir circuit templates optimized for client-side witness generation on resource-constrained Android environments (MediaTek Dimensity 6300 / Moto G 2025).

## Directory Structure

```
circuits/
├── basic_proof/          # Basic proof-of-knowledge circuit
│   ├── main.nr          # Circuit definition
│   └── Nargo.toml       # Circuit manifest
└── README.md            # This file
```

## Circuit: basic_proof

A foundational circuit demonstrating proof-of-knowledge without revealing the private input.

### Purpose

Proves knowledge of a private input `x` such that `x² = public_input` without revealing `x` itself.

### Inputs

| Input | Type | Visibility | Description |
|-------|------|-----------|-------------|
| `private_input` | Field | Private | The secret value to be proven |
| `public_input` | Field | Public | The squared result (public constraint) |

### Output

Returns the computed result (which equals `public_input` if constraints are satisfied).

### Usage

```bash
# Compile the circuit
nargo compile

# Generate witness from inputs
nargo prove

# Verify proof
nargo verify
```

## Adding New Circuits

To add a new circuit:

1. Create a new directory under `circuits/`:
   ```bash
   mkdir circuits/my_circuit
   ```

2. Create `main.nr` with your circuit logic:
   ```noir
   fn main(private_input: Field, public_input: Field) -> pub Field {
       // Your circuit logic here
       private_input + public_input
   }
   ```

3. Create `Nargo.toml`:
   ```toml
   [package]
   name = "my_circuit"
   type = "bin"
   authors = ["Your Name"]
   compiler_version = "0.30"

   [dependencies]
   std = { tag = "v0.30.0" }
   ```

4. Compile and test:
   ```bash
   cd circuits/my_circuit
   nargo compile
   nargo prove
   ```

## Client-Side Integration

From the mobile client, use the `AztecPxeClient` to compile and generate proofs:

```typescript
import { createAztecPxeClient } from "@/lib/aztec-pxe-client";

const client = createAztecPxeClient({
  rpcUrl: "https://your-pxe-endpoint.com",
});

// Compile circuit
const { verificationKey } = await client.compileCircuit(
  "circuits/basic_proof"
);

// Generate proof
const proof = await client.generateProof("basic_proof", {
  private_input: 5n,
  public_input: 25n,
});

// Verify proof
const isValid = await client.verifyProof(proof);
```

## Performance Considerations

- **Witness Generation:** Performed locally on the mobile device (minimal overhead).
- **Proof Construction:** Delegated to remote PXE (offloads heavy computation).
- **Verification:** Can be performed either locally or remotely depending on trust model.

## References

- [Noir Language Documentation](https://noir-lang.org/)
- [Aztec Protocol](https://aztec.network/)
- [Barretenberg Prover](https://github.com/AztecProtocol/barretenberg)
