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
export const convertUnit = (quantity, fromUnit, toUnit) => {
  const normalizedFromUnit = fromUnit ? fromUnit.toString().toLowerCase().trim() : '';
  const normalizedToUnit = toUnit ? toUnit.toString().toLowerCase().trim() : '';

  // If units are the same (after normalization), return quantity as is
  if (normalizedFromUnit === normalizedToUnit && normalizedFromUnit !== '') {
    return quantity;
  }

  const fromFactor = UNIT_CONVERSION_FACTORS[normalizedFromUnit];
  const toFactor = UNIT_CONVERSION_FACTORS[normalizedToUnit];

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
  const norm1 = unit1 ? unit1.toString().toLowerCase().trim() : '';
  const norm2 = unit2 ? unit2.toString().toLowerCase().trim() : '';

  if (norm1 === norm2 && norm1 !== '') return true;

  const relatedToUnit1 = RELATED_UNITS[norm1] || [norm1];
  return relatedToUnit1.includes(norm2);
};

/**
 * Gets all related units for a given unit
 * @param {string} unit - The base unit
 * @returns {string[]} - Array of related units
 */
export const getRelatedUnits = (unit) => {
  const norm = unit ? unit.toString().toLowerCase().trim() : '';
  return RELATED_UNITS[norm] || [unit];
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

// Add date formatting utility function
export function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Add date and time formatting utility function
export function formatDateTime(dateString) {
  if (!dateString) return { date: '', time: '' };
  const date = new Date(dateString);

  // Format date as dd/mm/yyyy
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  // Format time as HH:MM AM/PM
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours}:${minutes} ${ampm}`;

  return { date: formattedDate, time: formattedTime };
}

// Format date with time for display (dd/mm/yyyy on one line, h:mm am/pm on next line)
export function formatDateWithTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);

  // Format date as dd/mm/yyyy
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  // Format time as h:mm am/pm (12-hour format)
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12

  return (
    <>
      <div>{day}/{month}/{year}</div>
      <div>{hours}:{minutes} {ampm}</div>
    </>
  );
}
