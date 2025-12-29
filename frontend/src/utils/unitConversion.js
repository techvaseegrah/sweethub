/**
 * Utility functions for unit conversion in the billing system
 */

// Define unit conversion factors relative to the base unit (kg)
const UNIT_CONVERSION_FACTORS = {
  kg: 1,        // base unit
  gram: 0.001,  // 1 gram = 0.001 kg
  g: 0.001,     // shorthand for gram
  piece: 1,     // piece is treated as base unit for non-weight items
};

// Define related units that can be converted between
const RELATED_UNITS = {
  kg: ['kg', 'gram', 'g'],
  gram: ['gram', 'g', 'kg'],
  g: ['g', 'gram', 'kg'],
  piece: ['piece'],
};

/**
 * Converts a quantity from one unit to another
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - The unit to convert from
 * @param {string} toUnit - The unit to convert to
 * @returns {number} - The converted quantity
 */
export const convertUnit = (quantity, fromUnit, toUnit) => {
  const fromFactor = UNIT_CONVERSION_FACTORS[fromUnit];
  const toFactor = UNIT_CONVERSION_FACTORS[toUnit];

  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unsupported unit conversion: ${fromUnit} to ${toUnit}`);
  }

  // Convert to base unit (kg), then to target unit
  const quantityInBaseUnit = quantity * fromFactor;
  const convertedQuantity = quantityInBaseUnit / toFactor;

  return convertedQuantity;
};

/**
 * Checks if two units are related and can be converted between
 * @param {string} unit1 - First unit
 * @param {string} unit2 - Second unit
 * @returns {boolean} - Whether the units are related
 */
export const areRelatedUnits = (unit1, unit2) => {
  const relatedToUnit1 = RELATED_UNITS[unit1] || [unit1];
  return relatedToUnit1.includes(unit2);
};

/**
 * Gets all related units for a given unit
 * @param {string} unit - The base unit
 * @returns {string[]} - Array of related units
 */
export const getRelatedUnits = (unit) => {
  return RELATED_UNITS[unit] || [unit];
};

/**
 * Normalizes a unit name to its standard form
 * @param {string} unit - The unit to normalize
 * @returns {string} - The normalized unit
 */
export const normalizeUnit = (unit) => {
  if (unit === 'g') return 'gram';
  return unit;
};

/**
 * Gets available units for a product based on its defined units
 * @param {Array} productPrices - Array of price objects from the product
 * @returns {Array} - Array of available units including related units
 */
export const getAvailableUnits = (productPrices) => {
  if (!productPrices || !Array.isArray(productPrices)) {
    return [];
  }

  // Get all units defined for the product
  const definedUnits = productPrices.map(price => price.unit);
  
  // For each defined unit, add its related units
  const allUnits = new Set();
  definedUnits.forEach(unit => {
    allUnits.add(unit);
    const related = getRelatedUnits(unit);
    related.forEach(relUnit => allUnits.add(relUnit));
  });

  return Array.from(allUnits);
};