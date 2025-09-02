import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Typography,
  Input,
  ListItem,
  ListSection,
  ListSeparator,
  PaperBackground,
  NotebookCard,
  HandwrittenText,
  PaperButton,
  // Modern components
  ModernCard,
  ModernCardHeader,
  ModernCardContent,
  ModernCardFooter,
  FeatureCard,
  InkButton,
  GlassCard,
  FloatingGlass,
  GlassMorphism,
  // Apple-grade components
  AppleButton,
  AppleText,
  LargeTitle,
  Title1,
  Title2,
  Title3,
  Headline,
  Body,
  Callout,
  Subheadline,
  Footnote,
  Caption1,
  Caption2,
} from '../../components/ui';

interface DesignSystemScreenProps {
  navigation: any;
}

export const DesignSystemScreen: React.FC<DesignSystemScreenProps> = ({ navigation }) => {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [switchValue, setSwitchValue] = useState(false);

  // Color palette data
  const colorCategories = [
    {
      title: 'Primary Colors',
      colors: [
        { name: 'Primary', value: theme.colors.primary },
        { name: 'Primary Light', value: theme.colors.primaryLight },
        { name: 'Primary Dark', value: theme.colors.primaryDark },
      ],
    },
    {
      title: 'Background Colors',
      colors: [
        { name: 'Background', value: theme.colors.background },
        { name: 'Background Secondary', value: theme.colors.backgroundSecondary },
        { name: 'Surface', value: theme.colors.surface },
      ],
    },
    {
      title: 'Text Colors',
      colors: [
        { name: 'Text', value: theme.colors.text },
        { name: 'Text Secondary', value: theme.colors.textSecondary },
        { name: 'Text Tertiary', value: theme.colors.textTertiary },
      ],
    },
    {
      title: 'Status Colors',
      colors: [
        { name: 'Success', value: theme.colors.success },
        { name: 'Warning', value: theme.colors.warning },
        { name: 'Error', value: theme.colors.error },
        { name: 'Info', value: theme.colors.info },
      ],
    },
    {
      title: 'BuJo Colors',
      colors: [
        { name: 'Task', value: theme.colors.bujo.task },
        { name: 'Complete', value: theme.colors.bujo.taskComplete },
        { name: 'Migrated', value: theme.colors.bujo.taskMigrated },
        { name: 'Scheduled', value: theme.colors.bujo.taskScheduled },
        { name: 'Event', value: theme.colors.bujo.event },
        { name: 'Note', value: theme.colors.bujo.note },
      ],
    },
  ];

  const ColorSwatch: React.FC<{ name: string; color: string }> = ({ name, color }) => (
    <View style={styles.colorSwatch}>
      <View style={[styles.colorBox, { backgroundColor: color }]} />
      <Typography variant="caption" style={styles.colorName}>{name}</Typography>
      <Typography variant="caption" color="secondary" style={styles.colorValue}>{color}</Typography>
    </View>
  );

  return (
    <PaperBackground variant="subtle" intensity="minimal">
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h2" weight="bold" style={{ marginBottom: 8 }}>
              Modern Design System
            </Typography>
            <Typography variant="body2" color="secondary">
              Paper aesthetic meets modern design • {theme.isDark ? 'Midnight' : 'Daylight'} mode
            </Typography>
          </View>

        {/* Apple-Grade Components */}
        <ListSection title="🍎 Apple-Grade Components">
          <ModernCard padding="lg" style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
            <Title2 weight="semibold" style={{ marginBottom: theme.spacing.md }}>
              Apple Typography System
            </Title2>
            <Body color="secondary" style={{ marginBottom: theme.spacing.xl }}>
              Precise text styles with Dynamic Type support and proper optical sizing.
            </Body>
            
            <View style={{ gap: theme.spacing.md }}>
              <LargeTitle>Large Title</LargeTitle>
              <Title1>Title 1</Title1>
              <Title2>Title 2</Title2>
              <Title3>Title 3</Title3>
              <Headline>Headline</Headline>
              <Body>Body - The quick brown fox jumps over the lazy dog</Body>
              <Callout>Callout - Perfect for secondary information</Callout>
              <Subheadline>Subheadline - Smaller than body text</Subheadline>
              <Footnote>Footnote - For fine print and metadata</Footnote>
              <Caption1>Caption 1 - Very small text</Caption1>
              <Caption2>Caption 2 - Smallest text size</Caption2>
            </View>
          </ModernCard>

          <ModernCard padding="lg" style={{ marginHorizontal: theme.spacing.lg }}>
            <Title2 weight="semibold" style={{ marginBottom: theme.spacing.md }}>
              Apple Button System
            </Title2>
            <Body color="secondary" style={{ marginBottom: theme.spacing.xl }}>
              Sophisticated interaction states with Apple's precise spring animations.
            </Body>
            
            <View style={styles.buttonSection}>
              <View style={styles.buttonRow}>
                <AppleButton 
                  title="Primary" 
                  role="primary" 
                  size="regular"
                  onPress={() => Alert.alert('Apple Button!', 'Primary button pressed')} 
                />
                <AppleButton 
                  title="Secondary" 
                  role="secondary" 
                  size="regular"
                  onPress={() => Alert.alert('Secondary!')} 
                />
              </View>
              
              <View style={styles.buttonRow}>
                <AppleButton 
                  title="Destructive" 
                  role="destructive" 
                  size="regular"
                  onPress={() => Alert.alert('Destructive Action')} 
                />
                <AppleButton 
                  title="Cancel" 
                  role="cancel" 
                  size="regular"
                  onPress={() => Alert.alert('Cancelled')} 
                />
              </View>
              
              <View style={styles.buttonRow}>
                <AppleButton 
                  title="Small" 
                  role="primary" 
                  size="small"
                  onPress={() => {}} 
                />
                <AppleButton 
                  title="Large" 
                  role="primary" 
                  size="large"
                  onPress={() => {}} 
                />
                <AppleButton 
                  icon="heart" 
                  role="primary" 
                  size="regular"
                  onPress={() => {}} 
                />
              </View>
              
              <AppleButton 
                title="Full Width Button" 
                role="primary" 
                size="regular"
                fullWidth
                icon="star"
                onPress={() => Alert.alert('Full width!')} 
              />
              
              <View style={styles.buttonRow}>
                <AppleButton 
                  title="Loading" 
                  role="primary" 
                  size="regular"
                  loading
                  onPress={() => {}} 
                />
                <AppleButton 
                  title="Disabled" 
                  role="secondary" 
                  size="regular"
                  disabled
                  onPress={() => {}} 
                />
              </View>
            </View>
          </ModernCard>
        </ListSection>

        {/* Theme Controls */}
        <ListSection title="Theme Settings">
          <ListItem
            title="Dark Mode"
            subtitle={`Currently using ${themeMode} mode`}
            leftIcon="moon-outline"
            rightElement={
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
              />
            }
          />
          <ListSeparator />
          <ListItem
            title="System Theme"
            subtitle="Follow system appearance"
            leftIcon="phone-portrait-outline"
            rightElement={
              <Switch
                value={themeMode === 'system'}
                onValueChange={(value) => setThemeMode(value ? 'system' : 'light')}
              />
            }
          />
        </ListSection>

        {/* Modern Components */}
        <ListSection title="Modern Components">
          <View style={styles.modernSection}>
            {/* Modern Cards */}
            <ModernCard variant="elevated" padding="lg" style={{ marginBottom: theme.spacing.lg }}>
              <ModernCardHeader divider={true}>
                <Typography variant="h4" weight="semibold">Modern Card</Typography>
                <Typography variant="body2" color="secondary">
                  Clean, floating design with subtle shadows
                </Typography>
              </ModernCardHeader>
              <ModernCardContent>
                <Typography variant="body1" style={{ marginBottom: theme.spacing.md }}>
                  Modern cards feature clean lines, generous whitespace, and precise typography.
                </Typography>
                <View style={styles.buttonRow}>
                  <InkButton title="Primary" variant="filled" size="md" onPress={() => Alert.alert('Ink Button!')} />
                  <InkButton title="Outline" variant="outline" size="md" onPress={() => {}} />
                </View>
              </ModernCardContent>
            </ModernCard>

            {/* Glass Morphism */}
            <FloatingGlass elevation="high" style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.xl }}>
              <Typography variant="h4" weight="semibold" style={{ marginBottom: theme.spacing.md }}>
                Glass Morphism
              </Typography>
              <Typography variant="body1" color="secondary">
                Frosted glass effect with backdrop blur for modern overlays and modals.
              </Typography>
            </FloatingGlass>

            {/* Feature Card with Accent */}
            <FeatureCard accent="success" style={{ marginBottom: theme.spacing.lg }}>
              <Typography variant="h4" weight="semibold" color="success">
                Feature Card
              </Typography>
              <Typography variant="body2" color="secondary" style={{ marginTop: 4 }}>
                Highlighted card with colored accent border
              </Typography>
            </FeatureCard>
          </View>
        </ListSection>

        {/* Modern Buttons */}
        <ListSection title="Ink Buttons">
          <ModernCard padding="lg" style={{ marginHorizontal: theme.spacing.lg }}>
            <Typography variant="h4" style={{ marginBottom: theme.spacing.lg }}>Button Variants</Typography>
            
            <View style={styles.buttonSection}>
              <View style={styles.buttonRow}>
                <InkButton title="Filled" variant="filled" onPress={() => {}} />
                <InkButton title="Outline" variant="outline" onPress={() => {}} />
                <InkButton title="Ghost" variant="ghost" onPress={() => {}} />
              </View>
              
              <View style={styles.buttonRow}>
                <InkButton title="Ink Style" variant="ink" onPress={() => {}} />
                <InkButton icon="heart" variant="filled" onPress={() => {}} />
                <InkButton title="Loading" loading variant="filled" onPress={() => {}} />
              </View>
              
              <InkButton 
                title="Full Width Button" 
                variant="filled" 
                fullWidth 
                icon="rocket" 
                onPress={() => Alert.alert('Full Width!')} 
              />
            </View>
          </ModernCard>
        </ListSection>

        {/* Paper Components */}
        <ListSection title="Paper Heritage">
          <View style={styles.paperSection}>
            <NotebookCard variant="page" showHoles={true} style={{ marginBottom: theme.spacing.lg }}>
              <HandwrittenText variant="title" color="ink">Notebook Page</HandwrittenText>
              <HandwrittenText variant="body" color="ink" style={{ marginTop: theme.spacing.md }}>
                This is a notebook page with holes on the side, perfect for journal entries.
              </HandwrittenText>
              <View style={styles.buttonRow}>
                <PaperButton title="Ink" variant="ink" size="sm" onPress={() => {}} style={{ marginRight: 8 }} />
                <PaperButton title="Pencil" variant="pencil" size="sm" onPress={() => {}} style={{ marginRight: 8 }} />
                <PaperButton title="Highlight" variant="highlight" size="sm" onPress={() => {}} />
              </View>
            </NotebookCard>

            <NotebookCard variant="sticky" style={{ marginBottom: theme.spacing.lg }}>
              <HandwrittenText variant="note" color="blue">
                Sticky Note: Remember to review daily entries!
              </HandwrittenText>
            </NotebookCard>

            <NotebookCard variant="torn" style={{ marginBottom: theme.spacing.lg }}>
              <HandwrittenText variant="quote" color="red">
                "The power of the Bullet Journal is that it becomes whatever you need it to be."
              </HandwrittenText>
              <HandwrittenText variant="note" color="pencil" style={{ textAlign: 'right', marginTop: 8 }}>
                - Ryder Carroll
              </HandwrittenText>
            </NotebookCard>
          </View>
        </ListSection>

        {/* Typography */}
        <ListSection title="Typography">
          <CardContent>
            <View style={styles.typographySection}>
              <Typography variant="h1">Heading 1</Typography>
              <Typography variant="h2">Heading 2</Typography>
              <Typography variant="h3">Heading 3</Typography>
              <Typography variant="h4">Heading 4</Typography>
              <Typography variant="body1">Body 1 - Regular text for main content</Typography>
              <Typography variant="body2">Body 2 - Smaller text for secondary content</Typography>
              <Typography variant="caption">Caption - Small text for labels</Typography>
              <Typography variant="overline">Overline - Uppercase labels</Typography>
              <Typography variant="mono">Monospace - For bullet symbols: • ✗ > &lt;</Typography>
            </View>
          </CardContent>
        </ListSection>

        {/* Buttons */}
        <ListSection title="Buttons">
          <CardContent>
            <View style={styles.buttonSection}>
              <Typography variant="h4" style={{ marginBottom: theme.spacing.md }}>Variants</Typography>
              <View style={styles.buttonRow}>
                <Button 
                  title="Primary" 
                  variant="primary" 
                  onPress={() => Alert.alert('Primary Button')}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Button 
                  title="Secondary" 
                  variant="secondary" 
                  onPress={() => Alert.alert('Secondary Button')}
                />
              </View>
              <View style={styles.buttonRow}>
                <Button 
                  title="Outline" 
                  variant="outline" 
                  onPress={() => Alert.alert('Outline Button')}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Button 
                  title="Ghost" 
                  variant="ghost" 
                  onPress={() => Alert.alert('Ghost Button')}
                />
              </View>
              <Button 
                title="Destructive" 
                variant="destructive" 
                onPress={() => Alert.alert('Destructive Button')}
                fullWidth
              />

              <Typography variant="h4" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}>
                Sizes & States
              </Typography>
              <View style={styles.buttonRow}>
                <Button title="Small" size="sm" onPress={() => {}} style={{ marginRight: theme.spacing.sm }} />
                <Button title="Medium" size="md" onPress={() => {}} style={{ marginRight: theme.spacing.sm }} />
                <Button title="Large" size="lg" onPress={() => {}} />
              </View>
              <View style={styles.buttonRow}>
                <Button 
                  title="With Icon" 
                  icon="add" 
                  onPress={() => {}}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Button 
                  title="Loading" 
                  loading 
                  onPress={() => {}}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Button title="Disabled" disabled onPress={() => {}} />
              </View>
              <View style={styles.buttonRow}>
                <Button icon="camera" onPress={() => {}} style={{ marginRight: theme.spacing.sm }} />
                <Button icon="heart" variant="outline" onPress={() => {}} style={{ marginRight: theme.spacing.sm }} />
                <Button icon="share" variant="ghost" onPress={() => {}} />
              </View>
            </View>
          </CardContent>
        </ListSection>

        {/* Cards */}
        <ListSection title="Cards">
          <View style={styles.cardSection}>
            <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
              <CardHeader>
                <Typography variant="h4">Elevated Card</Typography>
                <Typography variant="body2" color="secondary">With shadow effect</Typography>
              </CardHeader>
              <CardContent>
                <Typography variant="body1">
                  This card uses the elevated variant with shadow for depth.
                </Typography>
              </CardContent>
              <CardFooter>
                <Button title="Action" size="sm" onPress={() => {}} />
              </CardFooter>
            </Card>

            <Card variant="outlined" style={{ marginBottom: theme.spacing.md }}>
              <CardHeader>
                <Typography variant="h4">Outlined Card</Typography>
                <Typography variant="body2" color="secondary">With border</Typography>
              </CardHeader>
              <CardContent>
                <Typography variant="body1">
                  This card uses the outlined variant with a border.
                </Typography>
              </CardContent>
            </Card>

            <Card variant="flat">
              <CardHeader>
                <Typography variant="h4">Flat Card</Typography>
                <Typography variant="body2" color="secondary">No shadow or border</Typography>
              </CardHeader>
              <CardContent>
                <Typography variant="body1">
                  This card uses the flat variant with no elevation.
                </Typography>
              </CardContent>
            </Card>
          </View>
        </ListSection>

        {/* Inputs */}
        <ListSection title="Input Fields">
          <CardContent>
            <View style={styles.inputSection}>
              <Input
                label="Outlined Input"
                placeholder="Enter text..."
                variant="outlined"
                value={inputValue}
                onChangeText={setInputValue}
                helperText="This is helper text"
                style={{ marginBottom: theme.spacing.lg }}
              />
              
              <Input
                label="Filled Input"
                placeholder="Enter text..."
                variant="filled"
                leftIcon="search"
                style={{ marginBottom: theme.spacing.lg }}
              />

              <Input
                label="With Icons"
                placeholder="Password..."
                leftIcon="lock-closed"
                rightIcon="eye-outline"
                secureTextEntry
                style={{ marginBottom: theme.spacing.lg }}
              />

              <Input
                label="Error State"
                placeholder="Enter email..."
                errorText="Please enter a valid email"
                leftIcon="mail"
                style={{ marginBottom: theme.spacing.lg }}
              />

              <Input
                label="Disabled"
                placeholder="Disabled input..."
                disabled
                value="Cannot edit"
              />
            </View>
          </CardContent>
        </ListSection>

        {/* Lists */}
        <ListSection title="List Components">
          <ListItem
            title="Simple List Item"
            onPress={() => Alert.alert('List Item Pressed')}
          />
          <ListSeparator />
          <ListItem
            title="With Subtitle"
            subtitle="Additional information goes here"
            leftIcon="person-outline"
            onPress={() => Alert.alert('List Item Pressed')}
          />
          <ListSeparator />
          <ListItem
            title="With Switch"
            subtitle="Toggle this setting"
            leftIcon="settings-outline"
            rightElement={
              <Switch value={switchValue} onValueChange={setSwitchValue} />
            }
          />
          <ListSeparator />
          <ListItem
            title="Disabled Item"
            subtitle="Cannot be pressed"
            leftIcon="ban-outline"
            disabled
          />
        </ListSection>

        {/* Color Palette */}
        <ListSection title="Color Palette">
          <CardContent>
            {colorCategories.map((category, index) => (
              <View key={index} style={styles.colorCategory}>
                <Typography variant="h4" style={{ marginBottom: theme.spacing.md }}>
                  {category.title}
                </Typography>
                <View style={styles.colorRow}>
                  {category.colors.map((color, colorIndex) => (
                    <ColorSwatch key={colorIndex} name={color.name} color={color.value} />
                  ))}
                </View>
                {index < colorCategories.length - 1 && (
                  <View style={{ height: theme.spacing.xl }} />
                )}
              </View>
            ))}
          </CardContent>
        </ListSection>

        {/* Spacing */}
        <ListSection title="Spacing System">
          <CardContent>
            <View style={styles.spacingSection}>
              <Typography variant="h4" style={{ marginBottom: theme.spacing.md }}>Spacing Scale</Typography>
              {Object.entries(theme.spacing).map(([key, value]) => (
                <View key={key} style={styles.spacingItem}>
                  <Typography variant="body2" style={styles.spacingLabel}>
                    {key}: {value}px
                  </Typography>
                  <View style={[styles.spacingBar, { width: value * 2, backgroundColor: theme.colors.primary }]} />
                </View>
              ))}
            </View>
          </CardContent>
        </ListSection>

        {/* Paper Backgrounds */}
        <ListSection title="Paper Backgrounds">
          <View style={styles.paperSection}>
            <View style={{ height: 100, marginBottom: theme.spacing.md }}>
              <PaperBackground variant="lined" showMargin={false}>
                <View style={{ padding: theme.spacing.lg }}>
                  <HandwrittenText variant="body">Lined paper background</HandwrittenText>
                </View>
              </PaperBackground>
            </View>
            
            <View style={{ height: 100, marginBottom: theme.spacing.md }}>
              <PaperBackground variant="grid">
                <View style={{ padding: theme.spacing.lg }}>
                  <HandwrittenText variant="body">Grid paper background</HandwrittenText>
                </View>
              </PaperBackground>
            </View>
            
            <View style={{ height: 100 }}>
              <PaperBackground variant="dotted">
                <View style={{ padding: theme.spacing.lg }}>
                  <HandwrittenText variant="body">Dotted paper background</HandwrittenText>
                </View>
              </PaperBackground>
            </View>
          </View>
        </ListSection>

        {/* Bottom padding for safe area */}
        <View style={{ height: theme.spacing.xl4 }} />
      </ScrollView>
    </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  modernSection: {
    paddingHorizontal: 20,
  },
  paperSection: {
    paddingHorizontal: 20,
  },
  typographySection: {
    gap: 12,
  },
  buttonSection: {
    gap: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  cardSection: {
    paddingHorizontal: 20,
  },
  inputSection: {
    gap: 16,
  },
  colorCategory: {
    marginBottom: 24,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    alignItems: 'center',
    minWidth: 80,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorName: {
    fontWeight: '500',
    textAlign: 'center',
  },
  colorValue: {
    fontSize: 10,
    textAlign: 'center',
  },
  spacingSection: {
    gap: 12,
  },
  spacingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacingLabel: {
    minWidth: 80,
  },
  spacingBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginLeft: 16,
  },
});