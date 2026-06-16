// Aztec Mobile Sandbox - Basic Proof Circuit
// A simple Noir circuit template demonstrating witness generation and proof construction
// for resource-constrained Android environments.

use dep::std;

// Main circuit function: proves knowledge of a private input that satisfies a constraint
fn main(
    private_input: Field,
    public_input: Field,
) -> pub Field {
    // Constraint: private_input^2 == public_input
    // This proves the prover knows a private value whose square equals the public value
    let result = private_input * private_input;
    
    assert(result == public_input, "Private input squared must equal public input");
    
    result
}

// Helper function: demonstrates state commitment
fn commit_state(
    state_data: [Field; 4],
) -> Field {
    // Simple hash-like commitment (in production, use Poseidon or Pedersen)
    let mut commitment = Field::from_le_bytes(&[0; 32]);
    
    for i in 0..4 {
        commitment = commitment + state_data[i];
    }
    
    commitment
}

// Helper function: verify transaction nonce ordering
fn verify_nonce_ordering(
    current_nonce: Field,
    previous_nonce: Field,
) -> bool {
    current_nonce > previous_nonce
}
