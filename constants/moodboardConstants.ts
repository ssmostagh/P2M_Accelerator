import type { PanelLayout } from '../types';

export const PANEL_LAYOUTS: PanelLayout[] = [
  // Column 1: 8 color swatches
  { id: 1, gridClass: 'col-start-1 col-span-1 row-start-1 row-span-1', type: 'color' },
  { id: 2, gridClass: 'col-start-1 col-span-1 row-start-2 row-span-1', type: 'color' },
  { id: 3, gridClass: 'col-start-1 col-span-1 row-start-3 row-span-1', type: 'color' },
  { id: 4, gridClass: 'col-start-1 col-span-1 row-start-4 row-span-1', type: 'color' },
  { id: 5, gridClass: 'col-start-1 col-span-1 row-start-5 row-span-1', type: 'color' },
  { id: 6, gridClass: 'col-start-1 col-span-1 row-start-6 row-span-1', type: 'color' },
  { id: 7, gridClass: 'col-start-1 col-span-1 row-start-7 row-span-1', type: 'color' },
  { id: 8, gridClass: 'col-start-1 col-span-1 row-start-8 row-span-1', type: 'color' },

  // Main grid area
  { id: 9, gridClass: 'col-start-2 col-span-2 row-start-1 row-span-8', aspectRatio: '9:16', type: 'image' },

  { id: 10, gridClass: 'col-start-4 col-span-3 row-start-1 row-span-5', aspectRatio: '3:4', type: 'image' },
  { id: 11, gridClass: 'col-start-4 col-span-3 row-start-6 row-span-3', aspectRatio: '16:9', type: 'image' },

  { id: 12, gridClass: 'col-start-7 col-span-2 row-start-1 row-span-3', aspectRatio: '4:3', type: 'image' },
  { id: 13, gridClass: 'col-start-7 col-span-2 row-start-4 row-span-5', aspectRatio: '3:4', type: 'image' },

  { id: 14, gridClass: 'col-start-9 col-span-2 row-start-1 row-span-8', aspectRatio: '9:16', type: 'image' },

  { id: 15, gridClass: 'col-start-11 col-span-2 row-start-1 row-span-4', aspectRatio: '1:1', type: 'image' },
  { id: 16, gridClass: 'col-start-11 col-span-2 row-start-5 row-span-4', aspectRatio: '1:1', type: 'image' },

  // Column 6: Tall image on the right (matching column 2)
  { id: 17, gridClass: 'col-start-13 col-span-2 row-start-1 row-span-8', aspectRatio: '9:16', type: 'image' },
];

// Note: FIGURE_PROMPTS are now generic. Audience constraints are applied dynamically via getAudienceFigureConstraint()
export const FIGURE_PROMPTS: string[] = [
  'A single fashion model in a minimalist studio setting, wearing a key garment from the collection, clean background.',
  'A single person participating in an activity related to the theme, candid photography style.',
  'A fashion model showcasing the collection with confidence and attitude, editorial photography style.',
  'A model wearing the collection, emphasizing fashion representation, professional studio lighting.',
];

export const OBJECT_PROMPTS: string[] = [
  'A close-up photograph of a single decorative button or closure detail.',
  'A detailed product shot of a zipper or hardware trim on a neutral background.',
  'A single structured leather handbag photographed on a simple background.',
  'A pair of statement sunglasses or a single piece of jewelry on a clean surface.',
  'A close-up on intricate embroidery or stitching detail on fabric.',
  'A detailed shot of a single custom-designed button or fastener.',
  'A still life of one key accessory item like a belt, scarf, or pair of gloves.',
  'A single shoe or boot photographed as a product shot with clean background.',
  'A handcrafted brooch or pin displayed on a simple surface.',
  'A minimalist shot of fabric folded to show construction details like pleats or seams.',
];

export const SCENERY_PROMPTS: string[] = [
  'An atmospheric, moody landscape that reflects the collection\'s color palette, like a misty forest or a windswept coastline. No people.',
  'A sharp, geometric architectural facade with interesting shadows, inspiring structural elements of the designs. No people.',
  'An interior shot of an empty library or study with dark wood and leather-bound books, evoking a "dark academia" vibe. No people.',
  'A vintage architectural or landscape photograph from a relevant era, desaturated, capturing a mood. No people.',
  'A minimalist interior space with natural lighting and interesting textures on the walls. No people.',
  'An empty urban street scene with architectural elements that inspire the collection. No people.',
];

export const TEXTURE_PROMPTS: string[] = [
  'A macro photograph of a single fabric swatch showing the weave and texture clearly, like wool tweed or linen.',
  'A close-up of a textured leather surface filling the entire frame.',
  'A detailed shot of a single fabric texture like velvet, corduroy, or jacquard.',
  'A macro photograph of a knit or woven textile showing the construction details.',
  'A close-up of a silk or satin fabric showing the sheen and drape.',
  'A detailed photograph of a single patterned fabric swatch with repeating motifs.',
  'A macro shot of a quilted or embossed textile showing dimensional texture.',
  'A close-up of a mesh, lace, or perforated fabric detail.',
];

// Parse audience to extract gender and age constraints
export function parseAudienceConstraints(audience: string): { gender: string; age: string } {
  const lower = audience.toLowerCase();

  // Gender detection
  let gender = 'diverse'; // default
  if (lower.includes('unisex') || lower.includes('non-binary') || lower.includes('gender-neutral') || lower.includes('androgynous')) {
    gender = 'gender-diverse';
  } else if (lower.includes('men') && !lower.includes('women')) {
    gender = 'male';
  } else if (lower.includes('women') && !lower.includes('men')) {
    gender = 'female';
  } else if (lower.includes('male') && !lower.includes('female')) {
    gender = 'male';
  } else if (lower.includes('female') && !lower.includes('male')) {
    gender = 'female';
  }

  // Age detection
  let age = 'diverse ages'; // default
  if (lower.includes('gen z') || lower.includes('teens') || lower.includes('teenage')) {
    age = '18-24 years old (Gen Z)';
  } else if (lower.includes('millennials') || lower.includes('young adult')) {
    age = '25-40 years old (Millennials/Young Adults)';
  } else if (lower.includes('middle-aged') || lower.includes('middle age')) {
    age = '40-60 years old (Middle-aged)';
  } else if (lower.includes('senior') || lower.includes('elderly') || lower.includes('mature')) {
    age = '60+ years old (Seniors)';
  } else if (lower.includes('children') || lower.includes('kids')) {
    age = 'children (under 18)';
  } else if (lower.includes('young')) {
    age = '18-35 years old';
  }

  return { gender, age };
}

// Generate audience-specific figure prompt constraint
export function getAudienceFigureConstraint(audience: string): string {
  const { gender, age } = parseAudienceConstraints(audience);

  let constraint = '';

  // Gender constraint
  if (gender === 'male') {
    constraint += 'Feature male models only. ';
  } else if (gender === 'female') {
    constraint += 'Feature female models only. ';
  } else if (gender === 'gender-diverse') {
    constraint += 'Feature models of all gender presentations, including androgynous and non-binary individuals. ';
  } else {
    constraint += 'Feature a balanced mix of male and female models with diverse gender presentations. Do not default to only male or only female models. ';
  }

  // Age constraint
  if (age !== 'diverse ages') {
    constraint += `Models should be ${age}. `;
  } else {
    constraint += 'Include diverse age representation. ';
  }

  // Always add body diversity
  constraint += 'Ensure diverse representation across ethnicity and body type.';

  return constraint;
}
