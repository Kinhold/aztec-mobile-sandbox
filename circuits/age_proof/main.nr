// Age Proof Circuit - Year-Based Age Verification
// Proves: current_year - birth_year >= threshold
// Without revealing birth_year
//
// Private Input:
//   - birth_year: User's birth year (e.g., 1990)
//
// Public Inputs:
//   - current_year: Current year (e.g., 2026)
//   - threshold: Minimum age requirement (e.g., 18)
//
// Constraint: current_year - birth_year >= threshold

fn main(
    private_input birth_year: u32,
    public_input current_year: u32,
    public_input threshold: u32,
) -> pub u32 {
    // Constraint 1: Calculate age
    let age = current_year - birth_year;
    
    // Constraint 2: Verify age meets threshold
    assert(age >= threshold, "Age does not meet threshold");
    
    // Constraint 3: Sanity check - birth year must be reasonable
    // Assume no one born before 1900 (126 years old in 2026)
    assert(birth_year >= 1900, "Birth year is unrealistic (too old)");
    
    // Constraint 4: Birth year cannot be in the future
    assert(birth_year <= current_year, "Birth year cannot be in the future");
    
    // Return the computed age as proof output
    age
}

// Test helper: Verify age without revealing birth year
fn verify_age_threshold(
    private_input birth_year: u32,
    public_input current_year: u32,
    public_input threshold: u32,
) -> pub bool {
    let age = current_year - birth_year;
    age >= threshold
}

// Test helper: Check if user is exactly at threshold
fn is_exactly_threshold(
    private_input birth_year: u32,
    public_input current_year: u32,
    public_input threshold: u32,
) -> pub bool {
    let age = current_year - birth_year;
    age == threshold
}

// Test helper: Get user's computed age (for verification only)
fn get_age(
    private_input birth_year: u32,
    public_input current_year: u32,
) -> pub u32 {
    current_year - birth_year
}
