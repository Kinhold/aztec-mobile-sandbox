# Noir circuit sketches

`basic_proof` is an exploratory identity-commitment circuit source tree. It is not connected to the Expo app, compiled by the pnpm build, or covered by the current test suite.

The checked-in manifest targets an old Noir compiler declaration and its source has not been validated in this repository against a current Nargo release. Treat the code, gate counts, proof sizes, and performance descriptions in historical files as design notes—not measured behavior.

Before using this circuit:

1. Choose and pin a supported Noir/Aztec release.
2. Update the manifest and source to that release's APIs.
3. Compile, execute, prove, and verify it with known-good and failing vectors.
4. Review input serialization and the unused helper functions.
5. Add those checks to CI and wire the resulting artifact through a tested SDK integration.

No mobile witness or proof generation is implemented today.
