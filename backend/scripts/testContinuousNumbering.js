// Test script to demonstrate continuous numbering behavior
console.log("=== Continuous Bill Numbering Test ===");

console.log("\nExamples of the new bill ID formats:");
console.log("- Shop bills: SHP-TN01-0001, SHP-TN01-0002, SHP-TN01-0003...");
console.log("- Admin bills: ADM-0001, ADM-0002, ADM-0003...");

console.log("\nThe numbering continues sequentially without daily resets.");
console.log("This means tomorrow's first bill will be SHP-TN01-0004, not SHP-TN01-20251216-0001.");

console.log("\nBenefits of this approach:");
console.log("1. Truly sequential numbering across all days");
console.log("2. No gaps in numbering due to date changes");
console.log("3. Simpler format without date component");
console.log("4. Easier to track and reference bill numbers");