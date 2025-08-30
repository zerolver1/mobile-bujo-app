import { ColorPalette } from './types';

// Paper-themed color system that maintains Apple's accessibility while feeling like a real notebook
export const paperSemanticColors = {
  // Paper base colors - warm and organic
  paper: {
    // Light mode papers - cream, parchment, aged
    cream: '#F9F6F0',        // Primary paper background
    parchment: '#F5F2E8',    // Secondary paper background  
    aged: '#F2EFE5',         // Tertiary paper background
    margin: '#E8E3D5',       // Paper margin/ruled lines
  },
  paperDark: {
    // Dark mode papers - warm dark tones like evening notebook
    charcoal: '#1A1814',     // Primary dark paper
    sepia: '#2B2820',        // Secondary dark paper
    vintage: '#1F1E19',      // Tertiary dark paper
    margin: '#3D3A32',       // Dark margin/ruled lines
  },

  // Ink colors - natural writing implements
  ink: {
    // Primary writing colors
    fountain: '#0F2A44',     // Deep fountain pen blue-black
    ballpoint: '#1B365D',    // Ballpoint pen blue
    gel: '#0D1F35',          // Gel pen deep blue
    black: '#2B2B2B',        // Warm black ink
    
    // Secondary ink colors
    royal: '#1E40AF',        // Royal blue ink
    navy: '#1E3A8A',         // Navy blue ink
    
    // Light variants for dark mode
    fountainLight: '#4A90E2', // Fountain pen on dark paper
    ballpointLight: '#60A5FA', // Ballpoint on dark paper
    gelLight: '#3B82F6',      // Gel pen on dark paper
    blackLight: '#E5E5E5',    // Light ink on dark paper
  },

  // Pencil colors - graphite and colored pencils
  pencil: {
    graphite: '#6B7280',     // Graphite pencil
    charcoal: '#4B5563',     // Charcoal pencil
    light: '#9CA3AF',        // Light pencil marks
    
    // Dark mode variants
    graphiteDark: '#9CA3AF',
    charcoalDark: '#D1D5DB',
    lightDark: '#6B7280',
  },

  // Highlight colors - marker and highlight pen colors
  highlight: {
    yellow: 'rgba(251, 191, 36, 0.3)',    // Yellow highlighter
    green: 'rgba(34, 197, 94, 0.25)',     // Green highlighter  
    blue: 'rgba(59, 130, 246, 0.25)',     // Blue highlighter
    pink: 'rgba(236, 72, 153, 0.25)',     // Pink highlighter
    orange: 'rgba(249, 115, 22, 0.3)',    // Orange highlighter
  },

  // Paper textures and accents
  texture: {
    ruling: 'rgba(0, 0, 0, 0.06)',        // Ruled line color (light)
    rulingDark: 'rgba(255, 255, 255, 0.08)', // Ruled lines (dark)
    perforation: 'rgba(0, 0, 0, 0.12)',   // Perforation dots
    perforationDark: 'rgba(255, 255, 255, 0.15)',
    stain: 'rgba(139, 69, 19, 0.08)',     // Coffee/tea stains
    aging: 'rgba(160, 82, 45, 0.05)',     // Paper aging effects
  },

  // Specialty paper elements
  specialty: {
    stickyYellow: '#FEF3C7',   // Sticky note yellow
    stickyPink: '#FCE7F3',     // Sticky note pink
    stickyBlue: '#DBEAFE',     // Sticky note blue
    stickyGreen: '#D1FAE5',    // Sticky note green
    
    // Dark mode sticky notes (more muted)
    stickyYellowDark: '#451A03',
    stickyPinkDark: '#4C1D2F',
    stickyBlueDark: '#1E3A8A',
    stickyGreenDark: '#14532D',
  },
};

// Light mode paper color palette
export const lightPaperColors: ColorPalette = {
  // Primary colors using ink blue instead of digital blue
  primary: paperSemanticColors.ink.fountain,
  primaryLight: 'rgba(15, 42, 68, 0.1)',
  primaryDark: paperSemanticColors.ink.gel,
  
  // Secondary colors using natural green ink
  secondary: '#15803D', // Forest green ink
  secondaryLight: 'rgba(21, 128, 61, 0.1)',
  secondaryDark: '#14532D',
  
  // Paper backgrounds instead of stark whites
  background: paperSemanticColors.paper.cream,
  backgroundSecondary: paperSemanticColors.paper.parchment,
  backgroundTertiary: paperSemanticColors.paper.aged,
  
  // Surface colors for cards and panels
  surface: paperSemanticColors.paper.cream,
  surfaceSecondary: paperSemanticColors.paper.parchment,
  
  // Text colors using ink tones
  text: paperSemanticColors.ink.black,
  textSecondary: paperSemanticColors.pencil.graphite,
  textTertiary: paperSemanticColors.pencil.light,
  textDisabled: '#D1D5DB',
  
  // Border colors using subtle paper lines
  border: paperSemanticColors.paper.margin,
  borderLight: paperSemanticColors.texture.ruling,
  
  // Status colors using natural ink colors
  success: '#15803D', // Green ink
  successLight: 'rgba(21, 128, 61, 0.1)',
  warning: '#D97706', // Orange ink
  warningLight: 'rgba(217, 119, 6, 0.1)',
  error: '#B91C1C', // Red ink
  errorLight: 'rgba(185, 28, 28, 0.1)',
  info: paperSemanticColors.ink.royal,
  infoLight: 'rgba(30, 64, 175, 0.1)',
  
  // BuJo specific colors using paper notebook colors
  bujo: {
    task: paperSemanticColors.ink.black,
    taskComplete: '#15803D',
    taskMigrated: '#D97706',
    taskScheduled: paperSemanticColors.ink.royal,
    taskCancelled: paperSemanticColors.pencil.light,
    event: paperSemanticColors.ink.fountain,
    note: paperSemanticColors.pencil.graphite,
    inspiration: '#EAB308', // Golden ink
    research: '#7C3AED', // Purple ink
    memory: '#BE185D', // Magenta ink
  },
};

// Dark mode paper color palette - like writing in a notebook at night
export const darkPaperColors: ColorPalette = {
  // Primary colors using lighter ink for dark paper
  primary: paperSemanticColors.ink.fountainLight,
  primaryLight: 'rgba(74, 144, 226, 0.15)',
  primaryDark: paperSemanticColors.ink.ballpointLight,
  
  // Secondary colors
  secondary: '#4ADE80', // Bright green ink on dark paper
  secondaryLight: 'rgba(74, 222, 128, 0.15)',
  secondaryDark: '#16A34A',
  
  // Dark paper backgrounds
  background: paperSemanticColors.paperDark.charcoal,
  backgroundSecondary: paperSemanticColors.paperDark.sepia,
  backgroundTertiary: paperSemanticColors.paperDark.vintage,
  
  // Surface colors
  surface: paperSemanticColors.paperDark.sepia,
  surfaceSecondary: paperSemanticColors.paperDark.vintage,
  
  // Text colors for dark paper
  text: paperSemanticColors.ink.blackLight,
  textSecondary: paperSemanticColors.pencil.graphiteDark,
  textTertiary: paperSemanticColors.pencil.lightDark,
  textDisabled: '#4B5563',
  
  // Border colors for dark paper
  border: paperSemanticColors.paperDark.margin,
  borderLight: paperSemanticColors.texture.rulingDark,
  
  // Status colors for dark mode
  success: '#4ADE80',
  successLight: 'rgba(74, 222, 128, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.15)',
  info: paperSemanticColors.ink.ballpointLight,
  infoLight: 'rgba(96, 165, 250, 0.15)',
  
  // BuJo specific colors for dark mode
  bujo: {
    task: paperSemanticColors.ink.blackLight,
    taskComplete: '#4ADE80',
    taskMigrated: '#FBBF24',
    taskScheduled: paperSemanticColors.ink.ballpointLight,
    taskCancelled: paperSemanticColors.pencil.lightDark,
    event: paperSemanticColors.ink.fountainLight,
    note: paperSemanticColors.pencil.graphiteDark,
    inspiration: '#FDE047',
    research: '#A78BFA',
    memory: '#F472B6',
  },
};

// Export paper-themed colors as the main color system
export { lightPaperColors as lightColors, darkPaperColors as darkColors };