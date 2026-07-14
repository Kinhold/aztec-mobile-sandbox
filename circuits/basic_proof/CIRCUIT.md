# Identity commitment circuit sketch

The source is intended to assert that a private 32-byte value hashes to a public field. It also contains unused experimental helper functions.

This circuit is not production-ready:

- it has not been compiled or tested in this repository;
- the manifest's Noir version is historical;
- input encoding and helper APIs may not compile with a current toolchain;
- no gate count, proof size, timing, privacy, non-linkability, or Aztec compatibility claim has been measured;
- the Expo UI and experimental JSON-RPC adapter do not load this circuit.

See [`../README.md`](../README.md) for the validation work required before use.
