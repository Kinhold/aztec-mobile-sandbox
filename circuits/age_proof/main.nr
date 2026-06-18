// Age Proof Circuit - ZK Mobile Identity Suite
// Proves that a user is over a minimum age without revealing their exact birthdate
//
// Public Inputs:
//   - min_age: Minimum age threshold (e.g., 18, 21)
//   - current_timestamp: Current Unix timestamp
//   - age_commitment: Hash of (birthdate || nonce)
//
// Private Inputs:
//   - birthdate: User's birthdate (Unix timestamp)
//   - nonce: Random nonce for privacy
//
// Constraint: current_timestamp - birthdate >= min_age * 365.25 * 86400 (seconds in a year)

use std::hash::poseidon::bn254::hash_to_field;

fn main(
    private_input birthdate: u64,
    private_input nonce: [u8; 32],
    public_input min_age: u32,
    public_input current_timestamp: u64,
    public_input age_commitment: Field,
) -> pub Field {
    // Verify the age commitment matches the private birthdate and nonce
    let commitment_preimage = [birthdate as u8; 8];
    let mut combined = [0u8; 40];
    
    // Copy birthdate bytes (8 bytes)
    for i in 0..8 {
        combined[i] = commitment_preimage[i];
    }
    
    // Copy nonce bytes (32 bytes)
    for i in 0..32 {
        combined[8 + i] = nonce[i];
    }
    
    // Compute Poseidon hash of (birthdate || nonce)
    let computed_commitment = hash_to_field(combined);
    
    // Constraint 1: Commitment must match
    assert_eq(computed_commitment, age_commitment, "Age commitment mismatch");
    
    // Constraint 2: User must be at least min_age years old
    // Calculate minimum birthdate for the given age threshold
    let seconds_per_year = 31557600; // 365.25 days in seconds
    let min_age_seconds = (min_age as u64) * seconds_per_year;
    let minimum_birthdate = current_timestamp - min_age_seconds;
    
    // Verify birthdate is old enough
    assert(birthdate <= minimum_birthdate, "User is not old enough");
    
    // Constraint 3: Birthdate must be reasonable (not in the future, not before 1900)
    let year_1900_timestamp = 946684800; // Jan 1, 2000 Unix timestamp (conservative)
    assert(birthdate >= year_1900_timestamp, "Birthdate is unrealistic");
    assert(birthdate <= current_timestamp, "Birthdate cannot be in the future");
    
    // Return proof of age verification (1 = verified)
    1
}

// Helper function to verify multiple age thresholds
fn verify_multiple_ages(
    private_input birthdate: u64,
    private_input nonce: [u8; 32],
    public_input age_thresholds: [u32; 4],
    public_input current_timestamp: u64,
    public_input age_commitment: Field,
) -> pub [u8; 4] {
    let mut results = [0u8; 4];
    let seconds_per_year = 31557600;
    
    // Verify commitment once
    let commitment_preimage = [birthdate as u8; 8];
    let mut combined = [0u8; 40];
    for i in 0..8 {
        combined[i] = commitment_preimage[i];
    }
    for i in 0..32 {
        combined[8 + i] = nonce[i];
    }
    let computed_commitment = hash_to_field(combined);
    assert_eq(computed_commitment, age_commitment, "Age commitment mismatch");
    
    // Check each age threshold
    for i in 0..4 {
        let min_age_seconds = (age_thresholds[i] as u64) * seconds_per_year;
        let minimum_birthdate = current_timestamp - min_age_seconds;
        
        if birthdate <= minimum_birthdate {
            results[i] = 1;
        }
    }
    
    results
}

// Helper function to prove age range (e.g., between 18 and 65)
fn verify_age_range(
    private_input birthdate: u64,
    private_input nonce: [u8; 32],
    public_input min_age: u32,
    public_input max_age: u32,
    public_input current_timestamp: u64,
    public_input age_commitment: Field,
) -> pub Field {
    let seconds_per_year = 31557600;
    
    // Verify commitment
    let commitment_preimage = [birthdate as u8; 8];
    let mut combined = [0u8; 40];
    for i in 0..8 {
        combined[i] = commitment_preimage[i];
    }
    for i in 0..32 {
        combined[8 + i] = nonce[i];
    }
    let computed_commitment = hash_to_field(combined);
    assert_eq(computed_commitment, age_commitment, "Age commitment mismatch");
    
    // Verify age is within range
    let min_age_seconds = (min_age as u64) * seconds_per_year;
    let max_age_seconds = (max_age as u64) * seconds_per_year;
    
    let min_birthdate = current_timestamp - min_age_seconds;
    let max_birthdate = current_timestamp - max_age_seconds;
    
    assert(birthdate <= min_birthdate, "User is too young");
    assert(birthdate >= max_birthdate, "User is too old");
    
    1
}
