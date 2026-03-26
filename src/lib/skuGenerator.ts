/**
 * SKU Generator for Swarna / Jewel Luxe
 * 
 * Format: JL-{TYPE}-{COLOR}-{PRICE_TIER}-{SEQ}
 * Example: JL-NK-GLD-499-01
 * 
 * Supports both predefined values AND custom user input.
 */

// ─── Product Type Prefixes ──────────────────────────────────────────
export const PRODUCT_TYPE_PREFIXES: Record<string, string> = {
  'Necklace': 'NK',
  'Necklaces': 'NK',
  'Earrings': 'ER',
  'Bangles': 'BN',
  'Rings': 'RN',
  'Bracelets': 'BR',
  'Sets': 'ST',
  'Jhumka': 'JH',
  'Pendant': 'PN',
  'Anklet': 'AN',
  'Maangtika': 'MT',
  'Choker': 'CK',
  'Chain': 'CH',
  'Brooch': 'BC',
};

// ─── Color Codes ────────────────────────────────────────────────────
export const COLOR_CODES: Record<string, string> = {
  'Gold': 'GLD',
  'Silver': 'SLV',
  'Rose Gold': 'RG',
  'Oxidized': 'OX',
  'Multi': 'MLT',
  'White': 'WHT',
  'Pearl': 'PRL',
  'Black': 'BLK',
  'Antique': 'ATQ',
  'Kundan': 'KDN',
  'Meenakari': 'MNK',
  'Temple': 'TMP',
  'Diamond': 'DMD',
  'Red': 'RED',
  'Green': 'GRN',
  'Blue': 'BLU',
  'Pink': 'PNK',
};

// ─── Price Tiers ────────────────────────────────────────────────────
export const PRICE_TIERS = [
  { label: 'Below ₹199', max: 199, code: '199' },
  { label: '₹200 – ₹499', max: 499, code: '499' },
  { label: '₹500 – ₹699', max: 699, code: '699' },
  { label: '₹700 – ₹999', max: 999, code: '999' },
  { label: '₹1000+', max: Infinity, code: '1K' },
];

/**
 * Auto-detect price tier code from a numeric price.
 */
export function getPriceTierCode(price: number): string {
  for (const tier of PRICE_TIERS) {
    if (price <= tier.max) return tier.code;
  }
  return '1K';
}

/**
 * Generate prefix from a category name.
 * Uses the lookup table first; falls back to first 2 uppercase letters.
 */
export function getTypePrefix(categoryName: string): string {
  // Check exact match first
  if (PRODUCT_TYPE_PREFIXES[categoryName]) {
    return PRODUCT_TYPE_PREFIXES[categoryName];
  }
  // Check case-insensitive
  const lower = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(PRODUCT_TYPE_PREFIXES)) {
    if (key.toLowerCase() === lower) return value;
  }
  // Fallback: first 2 chars uppercase
  return categoryName.slice(0, 2).toUpperCase();
}

/**
 * Generate color code from a color name.
 * Uses the lookup table first; falls back to first 3 uppercase letters.
 */
export function getColorCode(colorName: string): string {
  if (COLOR_CODES[colorName]) {
    return COLOR_CODES[colorName];
  }
  const lower = colorName.toLowerCase();
  for (const [key, value] of Object.entries(COLOR_CODES)) {
    if (key.toLowerCase() === lower) return value;
  }
  // Fallback: first 3 chars uppercase
  return colorName.replace(/\s/g, '').slice(0, 3).toUpperCase();
}

/**
 * Build the full SKU string.
 */
export function buildSku(
  typePrefix: string,
  colorCode: string,
  priceTierCode: string,
  sequence: number
): string {
  const seq = String(sequence).padStart(2, '0');
  return `JL-${typePrefix}-${colorCode}-${priceTierCode}-${seq}`;
}

/**
 * All-in-one: generate a SKU from human-readable inputs.
 */
export function generateSku(
  categoryName: string,
  colorName: string,
  price: number,
  sequence: number = 1
): string {
  return buildSku(
    getTypePrefix(categoryName),
    getColorCode(colorName),
    getPriceTierCode(price),
    sequence
  );
}
