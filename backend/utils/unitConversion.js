/**
 * Utility functions for unit conversion in the billing system
 */

// Define unit conversion factors relative to the base unit (kg)
const UNIT_CONVERSION_FACTORS = {
  kg: 1,
  kilogram: 1,
  gram: 0.001,
  grams: 0.001,
  g: 0.001,
  piece: 1,
  pieces: 1,
  pcs: 1,
  pc: 1,
  box: 1,
  boxes: 1,
  packet: 1,
  packets: 1,
  liter: 1,
  liters: 1,
  l: 1,
  ml: 0.001,
  milliliter: 0.001,
  milliliters: 0.001,
};

// Define related units that can be converted between
const RELATED_UNITS = {
  kg: ['kg', 'gram', 'g', 'grams', 'kilogram'],
  kilogram: ['kg', 'gram', 'g', 'grams', 'kilogram'],
  gram: ['gram', 'g', 'kg', 'grams', 'kilogram'],
  grams: ['gram', 'g', 'kg', 'grams', 'kilogram'],
  g: ['g', 'gram', 'kg', 'grams', 'kilogram'],
  piece: ['piece', 'pieces', 'pcs', 'pc'],
  pieces: ['piece', 'pieces', 'pcs', 'pc'],
  pcs: ['piece', 'pieces', 'pcs', 'pc'],
  pc: ['piece', 'pieces', 'pcs', 'pc'],
  box: ['box', 'boxes'],
  boxes: ['box', 'boxes'],
  packet: ['packet', 'packets'],
  packets: ['packet', 'packets'],
  liter: ['liter', 'liters', 'l', 'ml'],
  liters: ['liter', 'liters', 'l', 'ml'],
  l: ['liter', 'liters', 'l', 'ml'],
  ml: ['ml', 'liter', 'liters', 'l'],
};

/**
 * Converts a quantity from one unit to another
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - The unit to convert from
 * @param {string} toUnit - The unit to convert to
 * @returns {number} - The converted quantity
 */
const convertUnit = (quantity, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return quantity;

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
const areRelatedUnits = (unit1, unit2) => {
  const relatedToUnit1 = RELATED_UNITS[unit1] || [unit1];
  return relatedToUnit1.includes(unit2);
};

/**
 * Gets all related units for a given unit
 * @param {string} unit - The base unit
 * @returns {string[]} - Array of related units
 */
const getRelatedUnits = (unit) => {
  return RELATED_UNITS[unit] || [unit];
};

/**
 * Normalizes a unit name to its standard form
 * @param {string} unit - The unit to normalize
 * @returns {string} - The normalized unit
 */
const normalizeUnit = (unit) => {
  if (unit === 'g') return 'gram';
  return unit;
};

/**
 * Gets available units for a product based on its defined units
 * @param {Array} productPrices - Array of price objects from the product
 * @returns {Array} - Array of available units including related units
 */
const getAvailableUnits = (productPrices) => {
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

module.exports = {
  convertUnit,
  areRelatedUnits,
  getRelatedUnits,
  normalizeUnit,
  getAvailableUnits
};