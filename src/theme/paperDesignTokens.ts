/**
 * Paper Design Tokens - Single Source of Truth
 * 
 * This file contains all design values for the paper journal aesthetic.
 * Changing values here will update the entire app consistently.
 */

// Base paper measurements (following real notebook dimensions)
export const PAPER_DIMENSIONS = {
  // Ruling measurements (based on standard notebook paper)
  lineHeight: 28, // Distance between ruled lines
  marginLeft: 72, // Standard red margin line position
  gridSize: 24, // Grid squares for graph paper
  dotSpacing: 32, // Dot grid spacing
  
  // Hole punch specifications
  holeSpacing: 80, // Distance between 3-ring holes
  holeSize: 12, // Diameter of holes
  holeOffset: 20, // Distance from left edge
} as const;

// Paper texture intensities
export const PAPER_INTENSITIES = {
  minimal: 0.03, // Barely visible texture
  light: 0.08,   // Subtle paper feel  
  normal: 0.15,  // Clear but not distracting
  strong: 0.25,  // Prominent texture
} as const;

// Ink and pen characteristics
export const INK_PROPERTIES = {
  // Ink bleeding and opacity effects
  bleeding: {
    none: 0,
    light: 0.1,
    medium: 0.2,
    heavy: 0.3,
  },
  
  // Text shadow for ink depth
  inkDepth: {
    light: { offset: { width: 0.5, height: 0.5 }, radius: 0.5, opacity: 0.1 },
    medium: { offset: { width: 1, height: 1 }, radius: 1, opacity: 0.2 },
    heavy: { offset: { width: 1.5, height: 1.5 }, radius: 1.5, opacity: 0.3 },
  },
  
  // Pen stroke widths
  strokeWidth: {
    pencil: 0.5,
    ballpoint: 1,
    gel: 1.5,
    fountain: 2,
    marker: 3,
  },
} as const;

// Paper rotation and imperfection angles (for realism)
export const PAPER_ANGLES = {
  stickyNote: { min: -2, max: 2 },
  tornPaper: { min: -0.5, max: 0.5 },
  highlight: { skew: -0.5 },
  notebook: { spine: -1 },
} as const;

// Spacing system (Apple's 4pt grid with paper context)
export const PAPER_SPACING = {
  // Core spacing values
  xs: 2,   // Tight spacing between related elements
  sm: 4,   // Small spacing within components
  md: 8,   // Default spacing between elements
  lg: 12,  // Spacing between sections
  xl: 16,  // Page margins
  xl2: 20, // Large section spacing
  xl3: 24, // Page-level spacing
  xl4: 32, // Screen-level spacing
  
  // Paper-specific spacing
  ruleMargin: 72,    // Left margin for ruled paper
  lineSpacing: 28,   // Between ruled lines
  paragraphGap: 16,  // Between paragraphs (as handwritten)
  bulletIndent: 20,  // BuJo bullet indentation
} as const;

// Border radius values (subtle, paper-like)
export const PAPER_RADIUS = {
  none: 0,    // Torn or cut paper
  subtle: 1,  // Slightly worn corners
  soft: 2,    // Natural paper curl
  card: 4,    // Card-like surfaces
  note: 6,    // Sticky notes
  button: 8,  // Interactive elements
  full: 9999, // Circular elements
} as const;

// Shadow definitions (warm, organic shadows)
export const PAPER_SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  // Subtle paper elevation
  paper: {
    shadowColor: 'rgba(139, 69, 19, 0.08)', // Warm brown shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Card-like elevation
  card: {
    shadowColor: 'rgba(139, 69, 19, 0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Sticky note shadow
  sticky: {
    shadowColor: 'rgba(217, 119, 6, 0.2)', // Orange sticky shadow
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Floating elements
  floating: {
    shadowColor: 'rgba(107, 114, 128, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Button size standards
export const PAPER_BUTTON_SIZES = {
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 32,
    fontSize: 14,
    iconSize: 14,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    fontSize: 16,
    iconSize: 16,
  },
  lg: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 18,
    iconSize: 18,
  },
} as const;

// Card padding options
export const PAPER_CARD_PADDING = {
  none: 0,
  sm: 8,   // Tight content
  md: 12,  // Standard content
  lg: 16,  // Spacious content
  xl: 20,  // Very spacious
} as const;

// Animation durations (organic, not digital)
export const PAPER_ANIMATIONS = {
  quick: 150,   // Quick feedback
  normal: 250,  // Standard transitions
  slow: 400,    // Page turning, etc.
  gentle: 600,  // Subtle state changes
} as const;

// Typography scale mapped to Apple text styles
export const PAPER_TYPOGRAPHY_SCALE = {
  // Main hierarchy
  largeTitle: { semantic: 'pageTitle', usage: 'Screen titles, major headings' },
  title1: { semantic: 'sectionTitle', usage: 'Section headings, card titles' },
  title2: { semantic: 'subsectionTitle', usage: 'Subsection headings' },
  title3: { semantic: 'entryTitle', usage: 'Entry titles, list headers' },
  headline: { semantic: 'emphasis', usage: 'Important callouts, labels' },
  body: { semantic: 'content', usage: 'Main content, entry text' },
  callout: { semantic: 'secondary', usage: 'Secondary information' },
  subheadline: { semantic: 'metadata', usage: 'Dates, tags, categories' },
  footnote: { semantic: 'detail', usage: 'Small details, fine print' },
  caption1: { semantic: 'micro', usage: 'Timestamps, counters' },
  caption2: { semantic: 'minimal', usage: 'Ultra-fine details' },
} as const;

// Export all design tokens as a single object for easy access
export const PAPER_DESIGN_TOKENS = {
  dimensions: PAPER_DIMENSIONS,
  intensities: PAPER_INTENSITIES,
  ink: INK_PROPERTIES,
  angles: PAPER_ANGLES,
  spacing: PAPER_SPACING,
  radius: PAPER_RADIUS,
  shadows: PAPER_SHADOWS,
  buttonSizes: PAPER_BUTTON_SIZES,
  cardPadding: PAPER_CARD_PADDING,
  animations: PAPER_ANIMATIONS,
  typography: PAPER_TYPOGRAPHY_SCALE,
} as const;

// Type exports for TypeScript support
export type PaperIntensity = keyof typeof PAPER_INTENSITIES;
export type PaperSpacing = keyof typeof PAPER_SPACING;
export type PaperRadius = keyof typeof PAPER_RADIUS;
export type PaperShadow = keyof typeof PAPER_SHADOWS;
export type PaperButtonSize = keyof typeof PAPER_BUTTON_SIZES;
export type PaperCardPadding = keyof typeof PAPER_CARD_PADDING;