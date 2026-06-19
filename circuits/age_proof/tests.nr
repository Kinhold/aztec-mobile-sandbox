// Comprehensive Test Suite for Age Proof Circuit
// Tests cover: underage, threshold, above threshold, future year, historical bounds

use crate::main;

#[test]
fn test_age_proof_above_threshold() {
    // User born in 1990, current year 2026, threshold 18
    // Age: 2026 - 1990 = 36, which is >= 18 ✓
    let age = main(1990, 2026, 18);
    assert_eq(age, 36);
}

#[test]
fn test_age_proof_exactly_threshold() {
    // User born in 2008, current year 2026, threshold 18
    // Age: 2026 - 2008 = 18, which is >= 18 ✓
    let age = main(2008, 2026, 18);
    assert_eq(age, 18);
}

#[test]
fn test_age_proof_well_above_threshold() {
    // User born in 1950, current year 2026, threshold 21
    // Age: 2026 - 1950 = 76, which is >= 21 ✓
    let age = main(1950, 2026, 21);
    assert_eq(age, 76);
}

#[test]
fn test_age_proof_high_threshold() {
    // User born in 1960, current year 2026, threshold 65
    // Age: 2026 - 1960 = 66, which is >= 65 ✓
    let age = main(1960, 2026, 65);
    assert_eq(age, 66);
}

#[test]
fn test_age_proof_low_threshold() {
    // User born in 2020, current year 2026, threshold 5
    // Age: 2026 - 2020 = 6, which is >= 5 ✓
    let age = main(2020, 2026, 5);
    assert_eq(age, 6);
}

#[test]
#[should_fail]
fn test_age_proof_underage() {
    // User born in 2015, current year 2026, threshold 18
    // Age: 2026 - 2015 = 11, which is < 18 ✗
    // This should fail the assertion
    let _age = main(2015, 2026, 18);
}

#[test]
#[should_fail]
fn test_age_proof_just_underage() {
    // User born in 2009, current year 2026, threshold 18
    // Age: 2026 - 2009 = 17, which is < 18 ✗
    // This should fail the assertion
    let _age = main(2009, 2026, 18);
}

#[test]
#[should_fail]
fn test_age_proof_birth_year_in_future() {
    // User born in 2030, current year 2026
    // Birth year > current year ✗
    // This should fail the sanity check
    let _age = main(2030, 2026, 18);
}

#[test]
#[should_fail]
fn test_age_proof_unrealistic_birth_year_too_old() {
    // User born in 1800, current year 2026
    // Birth year < 1900 ✗
    // This should fail the historical bounds check
    let _age = main(1800, 2026, 18);
}

#[test]
fn test_age_proof_boundary_birth_year_1900() {
    // User born in 1900, current year 2026, threshold 18
    // Age: 2026 - 1900 = 126 ✓
    // This is at the boundary (1900 is acceptable)
    let age = main(1900, 2026, 18);
    assert_eq(age, 126);
}

#[test]
#[should_fail]
fn test_age_proof_boundary_birth_year_1899() {
    // User born in 1899, current year 2026
    // Birth year < 1900 ✗
    // This should fail the historical bounds check
    let _age = main(1899, 2026, 18);
}

#[test]
fn test_age_proof_current_year_boundary() {
    // User born in 2026, current year 2026, threshold 0
    // Age: 2026 - 2026 = 0, which is >= 0 ✓
    let age = main(2026, 2026, 0);
    assert_eq(age, 0);
}

#[test]
#[should_fail]
fn test_age_proof_negative_threshold_not_allowed() {
    // Threshold should be non-negative
    // This test verifies the constraint system handles edge cases
    // Note: Noir u32 cannot be negative, so this is more of a documentation test
    let _age = main(2000, 2026, 0);
}

#[test]
fn test_age_proof_zero_threshold() {
    // User born in 2025, current year 2026, threshold 0
    // Age: 2026 - 2025 = 1, which is >= 0 ✓
    let age = main(2025, 2026, 0);
    assert_eq(age, 1);
}

#[test]
fn test_age_proof_large_age_gap() {
    // User born in 1900, current year 2026, threshold 100
    // Age: 2026 - 1900 = 126, which is >= 100 ✓
    let age = main(1900, 2026, 100);
    assert_eq(age, 126);
}

#[test]
#[should_fail]
fn test_age_proof_large_age_gap_fails() {
    // User born in 2000, current year 2026, threshold 100
    // Age: 2026 - 2000 = 26, which is < 100 ✗
    let _age = main(2000, 2026, 100);
}

#[test]
fn test_age_proof_year_2000() {
    // User born in 2000, current year 2026, threshold 18
    // Age: 2026 - 2000 = 26, which is >= 18 ✓
    let age = main(2000, 2026, 18);
    assert_eq(age, 26);
}

#[test]
fn test_age_proof_year_1999() {
    // User born in 1999, current year 2026, threshold 18
    // Age: 2026 - 1999 = 27, which is >= 18 ✓
    let age = main(1999, 2026, 18);
    assert_eq(age, 27);
}

#[test]
fn test_age_proof_recent_birth() {
    // User born in 2023, current year 2026, threshold 1
    // Age: 2026 - 2023 = 3, which is >= 1 ✓
    let age = main(2023, 2026, 1);
    assert_eq(age, 3);
}

#[test]
#[should_fail]
fn test_age_proof_recent_birth_fails() {
    // User born in 2024, current year 2026, threshold 5
    // Age: 2026 - 2024 = 2, which is < 5 ✗
    let _age = main(2024, 2026, 5);
}
