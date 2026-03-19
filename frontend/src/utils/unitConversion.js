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

  // Improved factor retrieval that handles numeric prefixes like "250g"
  const getFactor = (unit) => {
    if (!unit) return 1;

    // Check direct match
    if (UNIT_CONVERSION_FACTORS[unit] !== undefined) {
      return UNIT_CONVERSION_FACTORS[unit];
    }

    // Attempt to parse units like "250g", "500ml", "1kg", "250g packets"
    // Regex: look for a number optionally followed by a unit at the start
    const match = unit.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (match) {
      const value = parseFloat(match[1]);
      const baseUnit = match[2];

      // Get sub-factor for the base unit (e.g., "g" -> 0.001)
      const subFactor = UNIT_CONVERSION_FACTORS[baseUnit] !== undefined
        ? UNIT_CONVERSION_FACTORS[baseUnit]
        : 1;

      return value * subFactor;
    }

    return 1;
  };

  const fromFactor = getFactor(normalizedFromUnit);
  const toFactor = getFactor(normalizedToUnit);

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

  // Format time as HH:MM:SS AM/PM
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;

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

// Format schedule ID as a Batch ID
export function getBatchId(scheduleId, batchId) {
  // If we already have a clean sequential batchId, use it
  if (batchId && batchId !== 'N/A') return batchId;

  if (!scheduleId) return 'N/A';

  // Handle legacy IDs or already formatted PRO- IDs
  const idStr = scheduleId.toString();
  if (idStr.startsWith('LEGACY_') || idStr.startsWith('PRO-')) {
    return idStr;
  }

  // Format long IDs (like MongoDB Object IDs) to a shorter readable format
  // Using the last 8 characters for uniqueness
  if (idStr.length >= 8) {
    return `BAT-${idStr.slice(-8).toUpperCase()}`;
  }

  return `BAT-${idStr.toUpperCase()}`;
}
