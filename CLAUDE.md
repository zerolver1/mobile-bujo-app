# Paper Journal Style Guidelines for Bullet Journal App

## Design Philosophy
This app embraces the authentic feel of a **paper bullet journal** while maintaining **Apple's engineering excellence**. Every component should feel like it belongs in a physical notebook - with warm, organic textures and ink-like interactions.

## Core Principles

### 1. Paper-First Aesthetic
- **Background**: Always use cream (`#F9F6F0`) for light mode, charcoal (`#1A1814`) for dark mode
- **Surface**: Parchment tones (`#F5F2E8` light, `#2A2620` dark) for cards and elevated surfaces  
- **Texture**: Subtle paper grain and fibers, realistic ruling lines with slight imperfections
- **Shadows**: Warm, organic shadows that simulate paper depth, not harsh digital drops

### 2. Ink-Like Colors
- **Primary**: Fountain pen blue (`#0F2A44`) - for important elements
- **Text**: Warm black ink (`#2B2B2B`) - never harsh black
- **Secondary**: Forest green ink (`#15803D`) - for actions and success states
- **Accent**: Use ink colors like red (`#B91C1C`), orange (`#D97706`), purple (`#7C3AED`)

### 3. Apple Engineering Standards
- **Typography**: Use Apple's text styles (largeTitle, title1, body, etc.) with paper context
- **Spacing**: Follow 4pt grid system (4, 8, 12, 16, 20, 24, 32)
- **Accessibility**: Maintain contrast ratios and dynamic type support
- **Touch targets**: Minimum 44pt for interactive elements

## Component Usage Guidelines

### Backgrounds
```tsx
// ✅ ALWAYS use PaperBackground for screens
<PaperBackground variant="subtle" intensity="light">
  {content}
</PaperBackground>

// ✅ For ruled notebooks
<PaperBackground variant="lined" showMargin={true}>
  {content}  
</PaperBackground>
```

### Cards & Surfaces
```tsx
// ✅ Paper-themed cards
<NotebookCard variant="page" showHoles={false}>
  {content}
</NotebookCard>

// ✅ Sticky notes for temporary content
<NotebookCard variant="sticky">
  {content}
</NotebookCard>

// ✅ Standard elevated content
<Card variant="elevated" padding="md">
  {content}
</Card>
```

### Buttons & Interactions
```tsx
// ✅ Primary actions - ink pen style
<PaperButton variant="ink" size="md" title="Save Entry" />

// ✅ Secondary actions - pencil style  
<PaperButton variant="pencil" size="md" title="Cancel" />

// ✅ Highlights for emphasis
<PaperButton variant="highlight" size="sm" title="Important" />

// ✅ Temporary actions
<PaperButton variant="sticky" size="md" title="Quick Note" />
```

### Typography
```tsx
// ✅ Always use Typography component with proper hierarchy
<Typography variant="h1" color="text">Daily Log</Typography>
<Typography variant="body" color="textSecondary">Entry content</Typography>
<Typography variant="caption1" color="textTertiary">Metadata</Typography>
```

## Color System Architecture

### Centralized Design Tokens
All colors are defined in `src/theme/paperColors.ts`:
- **Paper colors**: Authentic backgrounds and surfaces
- **Ink colors**: Various pen/pencil colors for semantic meaning
- **Semantic mapping**: Light/dark mode consistency

### Usage Patterns
```tsx
const { theme } = useTheme();

// ✅ Use semantic color names
backgroundColor: theme.colors.surface
color: theme.colors.text
borderColor: theme.colors.border

// ✅ Use BuJo-specific colors
color: theme.colors.bujo.task
color: theme.colors.bujo.taskComplete
color: theme.colors.bujo.event
```

## Component Safety Standards

### Always Include Theme Safety Checks
```tsx
const getStyles = () => {
  // ✅ REQUIRED: Check if theme exists
  if (!theme?.colors || !theme?.typography) {
    return fallbackStyles;
  }
  
  return {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  };
};
```

### Use Fallback Values
```tsx
// ✅ Always provide fallbacks
paddingTop: theme?.spacing?.md || 8
fontSize: theme?.typography?.textStyles?.body?.fontSize || 17
```

## Screen Layout Patterns

### Standard Screen Structure
```tsx
const MyScreen = () => {
  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Card variant="flat" padding="md">
          <Typography variant="h2">Screen Title</Typography>
        </Card>
        
        {/* Main content */}
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <NotebookCard variant="page">
            {content}
          </NotebookCard>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};
```

## Migration Strategy

### Phase 1: Core Components (COMPLETE)
- ✅ Theme system with paper colors
- ✅ PaperBackground with textures
- ✅ PaperButton with ink variants  
- ✅ NotebookCard with realistic paper feel
- ✅ Typography with safety checks

### Phase 2: Screen Updates (IN PROGRESS)
1. Audit screens using old components
2. Replace Apple-only components with paper equivalents
3. Update layouts to use PaperBackground
4. Test light/dark mode consistency

### Phase 3: Enhancement
1. Add more paper textures and variants
2. Implement handwriting-style animations
3. Add subtle sound effects for paper interactions

## Updating the Entire App

### Single Source Updates
To change styles across the entire app:

1. **Update design tokens** in `src/theme/paperColors.ts`
2. **Modify component defaults** in individual component files
3. **Adjust theme constants** in `src/theme/constants.ts`

### Component Priority Order
1. **PaperBackground** - Affects all screens
2. **Typography** - Affects all text rendering
3. **PaperButton** - Affects all interactions
4. **Cards** - Affects all content containers
5. **Form components** - Affects all inputs

### Testing Checklist
- [ ] Light mode paper feel maintained
- [ ] Dark mode paper feel maintained  
- [ ] All interactive elements feel ink-like
- [ ] No harsh digital shadows or borders
- [ ] Typography hierarchy clear and readable
- [ ] Accessibility requirements met
- [ ] Performance impact minimal

## Forbidden Patterns

### ❌ DON'T Use These
```tsx
// ❌ Harsh digital shadows
shadowColor: '#000000'
shadowOpacity: 0.8

// ❌ Pure white/black backgrounds
backgroundColor: '#FFFFFF'
backgroundColor: '#000000'

// ❌ Neon or digital colors
backgroundColor: '#00FF00'
color: '#FF0000'

// ❌ Sharp, geometric borders
borderRadius: 0
borderWidth: 3

// ❌ Direct theme property access without safety
theme.colors.primary // Use theme?.colors?.primary || fallback
```

### ✅ DO Use These Instead
```tsx
// ✅ Warm, organic shadows
shadowColor: 'rgba(139, 69, 19, 0.1)'
shadowOpacity: 0.1

// ✅ Paper-like backgrounds
backgroundColor: theme.colors.surface
backgroundColor: theme.colors.background

// ✅ Ink-like colors
backgroundColor: theme.colors.primary
color: theme.colors.text

// ✅ Subtle, paper-like borders
borderRadius: 2-4
borderWidth: 0.5-1

// ✅ Safe theme access
theme?.colors?.primary || '#0F2A44'
```

## Development Workflow

1. **Always start with PaperBackground** when creating new screens
2. **Use paper-themed components** instead of creating custom styles
3. **Test in both light and dark modes** immediately
4. **Add safety checks** for all theme usage
5. **Follow Apple accessibility guidelines** while maintaining paper feel
6. **Ask for component additions** rather than inline styling

## Questions to Ask Before Styling

1. "Does this feel like something I'd find in a physical bullet journal?"
2. "Would this color exist in a real pen/ink set?"
3. "Does this texture feel organic and warm, not digital?"
4. "Is this accessible while maintaining the paper aesthetic?"
5. "Can this style be centrally updated if needed?"

Remember: **Paper first, Apple engineering second, digital aesthetics never.**