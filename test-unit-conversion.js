/**
 * Test script to verify unit conversion functionality
 */

// Import the unit conversion functions
const { convertUnit, getAvailableUnits, areRelatedUnits } = require('./backend/utils/unitConversion');

console.log('Testing Unit Conversion Functionality...\n');

// Test 1: Basic conversion from grams to kg
console.log('Test 1: Convert 250 grams to kg');
try {
    const result = convertUnit(250, 'gram', 'kg');
    console.log(`✓ 250 grams = ${result} kg (Expected: 0.25 kg)`);
    console.log(result === 0.25 ? '✓ Test PASSED' : `✗ Test FAILED - Expected 0.25, got ${result}`);
} catch (error) {
    console.log(`✗ Test FAILED - Error: ${error.message}`);
}
console.log();

// Test 2: Conversion from kg to grams
console.log('Test 2: Convert 0.5 kg to grams');
try {
    const result = convertUnit(0.5, 'kg', 'gram');
    console.log(`✓ 0.5 kg = ${result} grams (Expected: 500 grams)`);
    console.log(result === 500 ? '✓ Test PASSED' : `✗ Test FAILED - Expected 500, got ${result}`);
} catch (error) {
    console.log(`✗ Test FAILED - Error: ${error.message}`);
}
console.log();

// Test 3: Check if units are related
console.log('Test 3: Check if kg and gram are related units');
try {
    const result = areRelatedUnits('kg', 'gram');
    console.log(`✓ Are kg and gram related? ${result} (Expected: true)`);
    console.log(result === true ? '✓ Test PASSED' : `✗ Test FAILED - Expected true, got ${result}`);
} catch (error) {
    console.log(`✗ Test FAILED - Error: ${error.message}`);
}
console.log();

// Test 4: Get available units for a product with kg
console.log('Test 4: Get available units for a product defined in kg');
try {
    const productPrices = [{ unit: 'kg', sellingPrice: 100 }];
    const result = getAvailableUnits(productPrices);
    console.log(`✓ Available units for kg product: [${result.join(', ')}] (Expected: kg, gram, g)`);
    const expected = ['kg', 'gram', 'g'].every(unit => result.includes(unit));
    console.log(expected ? '✓ Test PASSED' : `✗ Test FAILED - Missing expected units`);
} catch (error) {
    console.log(`✗ Test FAILED - Error: ${error.message}`);
}
console.log();

// Test 5: Conversion with 'g' shorthand
console.log('Test 5: Convert 500 g to kg');
try {
    const result = convertUnit(500, 'g', 'kg');
    console.log(`✓ 500 g = ${result} kg (Expected: 0.5 kg)`);
    console.log(result === 0.5 ? '✓ Test PASSED' : `✗ Test FAILED - Expected 0.5, got ${result}`);
} catch (error) {
    console.log(`✗ Test FAILED - Error: ${error.message}`);
}
console.log();

// Test 6: Edge case - zero quantity
console.log('Test 6: Convert 0 grams to kg');
try {
    const result = convertUnit(0, 'gram', 'kg');
    console.log(`✓ 0 grams = ${result} kg (Expected: 0 kg)`);
    console.log(result === 0 ? '✓ Test PASSED' : `✗ Test FAILED - Expected 0, got ${result}`);
} catch (error) {
    console.log(`✗ Test FAILED - Error: ${error.message}`);
}
console.log();

console.log('Unit conversion tests completed!');