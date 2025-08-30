/**
 * Paper Components - Centralized Export
 * 
 * Single import point for all paper-themed UI components.
 * This ensures consistent component usage across the app.
 */

// Core paper components
export { PaperBackground, type PaperBackgroundProps } from '../PaperBackground';
export { PaperButton, type PaperButtonProps } from '../PaperButton';
export { NotebookCard, type NotebookCardProps } from '../NotebookCard';
export { Card, CardHeader, CardContent, CardFooter, type CardProps, type CardHeaderProps, type CardContentProps, type CardFooterProps } from '../Card';

// Enhanced typography with paper context
export { Typography, type TypographyProps } from '../Typography';
export { HandwrittenText, type HandwrittenTextProps } from '../HandwrittenText';

// Legacy components (use paper equivalents instead)
export { InkButton, type InkButtonProps } from '../InkButton';

// Utility components
export { GlassMorphism, type GlassMorphismProps } from '../GlassMorphism';

// Re-export design tokens and utilities for component customization
export { PAPER_DESIGN_TOKENS } from '../../../theme/paperDesignTokens';
export { 
  createPaperShadow,
  createInkTextStyle,
  createPaperButtonStyle,
  createPaperCardStyle,
  getPaperPatternProps,
  safeThemeAccess,
  COMMON_PAPER_STYLES,
} from '../../../theme/paperStyleUtils';

// Component usage guidelines and examples
export const PAPER_COMPONENT_EXAMPLES = {
  // Screen backgrounds
  screenBackground: `
    <PaperBackground variant="subtle" intensity="light">
      {/* Your screen content */}
    </PaperBackground>
  `,
  
  // Notebook pages
  notebookPage: `
    <PaperBackground variant="lined" showMargin={true}>
      <NotebookCard variant="page" showHoles={false}>
        {/* Page content */}
      </NotebookCard>
    </PaperBackground>
  `,
  
  // Quick notes/sticky notes
  stickyNote: `
    <NotebookCard variant="sticky">
      <Typography variant="body" color="text">
        Quick reminder...
      </Typography>
    </NotebookCard>
  `,
  
  // Primary actions
  primaryButton: `
    <PaperButton 
      variant="ink" 
      size="md" 
      title="Save Entry" 
      onPress={handleSave} 
    />
  `,
  
  // Secondary actions
  secondaryButton: `
    <PaperButton 
      variant="pencil" 
      size="md" 
      title="Cancel" 
      onPress={handleCancel} 
    />
  `,
  
  // Emphasized content
  highlightButton: `
    <PaperButton 
      variant="highlight" 
      size="sm" 
      title="Important" 
      onPress={handleHighlight} 
    />
  `,
  
  // Typography hierarchy
  typographyExample: `
    <Typography variant="h1" color="text">Daily Log</Typography>
    <Typography variant="body" color="textSecondary">
      Entry content goes here...
    </Typography>
    <Typography variant="caption1" color="textTertiary">
      Today, 2:30 PM
    </Typography>
  `,
  
  // Card layouts
  contentCard: `
    <Card variant="elevated" padding="md">
      <CardHeader>
        <Typography variant="headline">Section Title</Typography>
      </CardHeader>
      <CardContent>
        {/* Main content */}
      </CardContent>
      <CardFooter>
        {/* Actions or metadata */}
      </CardFooter>
    </Card>
  `,
} as const;

// Migration guide for old components
export const COMPONENT_MIGRATION_GUIDE = {
  // Old -> New component mappings
  'AppleButton': 'PaperButton with variant="ink"',
  'ModernCard': 'Card with variant="elevated"',
  'AppleText': 'Typography with appropriate variant',
  'Button': 'PaperButton with appropriate variant',
  
  // Common migration patterns
  migrations: {
    buttons: `
      // ❌ Old way
      <AppleButton title="Save" onPress={onSave} />
      
      // ✅ New way
      <PaperButton variant="ink" title="Save" onPress={onSave} />
    `,
    
    cards: `
      // ❌ Old way
      <ModernCard style={styles.card}>
        <Text style={styles.title}>Title</Text>
      </ModernCard>
      
      // ✅ New way
      <Card variant="elevated" padding="md">
        <Typography variant="headline">Title</Typography>
      </Card>
    `,
    
    backgrounds: `
      // ❌ Old way
      <View style={{ backgroundColor: theme.colors.background }}>
        {content}
      </View>
      
      // ✅ New way
      <PaperBackground variant="subtle" intensity="light">
        {content}
      </PaperBackground>
    `,
    
    typography: `
      // ❌ Old way
      <AppleText variant="title1">Header</AppleText>
      <Text style={{ color: theme.colors.text }}>Body</Text>
      
      // ✅ New way
      <Typography variant="h2">Header</Typography>
      <Typography variant="body" color="text">Body</Typography>
    `,
  },
} as const;

// Component priority for systematic updates
export const UPDATE_PRIORITY = [
  'PaperBackground', // Affects all screens
  'Typography',     // Affects all text
  'PaperButton',    // Affects all interactions
  'Card',           // Affects all containers
  'NotebookCard',   // Affects content layout
  'HandwrittenText', // Affects special text
] as const;

// Validation helpers to ensure proper usage
export const validatePaperComponent = (componentName: string, props: Record<string, any>) => {
  const warnings: string[] = [];
  
  // Common validation rules
  if (componentName === 'PaperButton' && !props.variant) {
    warnings.push('PaperButton should specify a variant (ink, pencil, highlight, sticky)');
  }
  
  if (componentName === 'Typography' && !props.variant) {
    warnings.push('Typography should specify a variant (h1, h2, body, etc.)');
  }
  
  if (componentName.includes('Card') && props.style?.backgroundColor) {
    warnings.push('Cards should use variant prop instead of backgroundColor style');
  }
  
  return warnings;
};

// Development mode component usage tracker
export const trackComponentUsage = (componentName: string) => {
  if (__DEV__) {
    console.log(`Paper Component Used: ${componentName}`);
  }
};