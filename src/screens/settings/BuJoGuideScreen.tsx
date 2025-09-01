import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { 
  PaperBackground, 
  Typography, 
  Card, 
  PaperButton,
  PAPER_DESIGN_TOKENS 
} from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface BuJoGuideScreenProps {
  navigation: any;
}

export const BuJoGuideScreen: React.FC<BuJoGuideScreenProps> = ({ navigation }) => {
  const [activeExample, setActiveExample] = useState<string | null>(null);
  const { theme } = useTheme();
  const bulletTypes = [
    {
      symbol: '•',
      name: 'Task',
      description: 'Something you need to do',
      color: '#007AFF',
    },
    {
      symbol: 'X',
      name: 'Complete',
      description: 'Task has been completed',
      color: '#34C759',
    },
    {
      symbol: '>',
      name: 'Migrated',
      description: 'Moved to next Monthly Log',
      color: '#FF9500',
    },
    {
      symbol: '<',
      name: 'Scheduled',
      description: 'Moved to Future Log',
      color: '#5856D6',
    },
    {
      symbol: '~',
      name: 'Cancelled',
      description: 'No longer relevant or needed',
      color: '#8E8E93',
    },
    {
      symbol: 'O',
      name: 'Event',
      description: 'Scheduled occasions, appointments',
      color: '#FF3B30',
    },
    {
      symbol: '—',
      name: 'Note',
      description: 'Information, ideas, observations',
      color: '#32D74B',
    },
    {
      symbol: '★',
      name: 'Inspiration',
      description: 'Brilliant ideas and creative thoughts',
      color: '#FFD60A',
    },
    {
      symbol: '&',
      name: 'Research',
      description: 'Investigation, study, learning topics',
      color: '#5856D6',
    },
    {
      symbol: '◇',
      name: 'Memory',
      description: 'Gratitude, special moments, reflections',
      color: '#FF2D55',
    },
  ];

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Card variant="elevated" padding="md" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
          </TouchableOpacity>
          <Typography variant="headline" color="text">Bullet Journal Guide</Typography>
          <View style={{ width: 24 }} />
        </Card>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title2" color="text" style={styles.sectionTitle}>Digital Enhancement, Not Replacement</Typography>
          <Typography variant="body" style={styles.text}>
            This app preserves your handwritten bullet journal system while adding digital convenience. 
            Scan your pages, review the results, and sync with your digital tools—all while keeping 
            paper as your source of truth.
          </Typography>
        </Card>

        {/* How It Works */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>How It Works</Typography>
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Typography variant="headline" style={styles.stepNumberText}>1</Typography>
              </View>
              <View style={styles.stepContent}>
                <Typography variant="headline" style={styles.stepTitle}>Scan Your Page</Typography>
                <Typography variant="body" style={styles.stepText}>
                  Use the camera to capture your handwritten bullet journal entries
                </Typography>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Typography variant="headline" style={styles.stepNumberText}>2</Typography>
              </View>
              <View style={styles.stepContent}>
                <Typography variant="headline" style={styles.stepTitle}>AI Recognition</Typography>
                <Typography variant="body" style={styles.stepText}>
                  Advanced OCR detects your bullets and understands your notation
                </Typography>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Typography variant="headline" style={styles.stepNumberText}>3</Typography>
              </View>
              <View style={styles.stepContent}>
                <Typography variant="headline" style={styles.stepTitle}>Quick Review</Typography>
                <Typography variant="body" style={styles.stepText}>
                  Confirm what was detected or make quick corrections
                </Typography>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Typography variant="headline" style={styles.stepNumberText}>4</Typography>
              </View>
              <View style={styles.stepContent}>
                <Typography variant="headline" style={styles.stepTitle}>Digital Sync</Typography>
                <Typography variant="body" style={styles.stepText}>
                  Tasks sync to Reminders, events to Calendar automatically
                </Typography>
              </View>
            </View>
          </View>
        </Card>

        {/* Bullet Reference */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>Bullet Journal Notation</Typography>
          <Typography variant="body" style={styles.text}>
            The app recognizes all official Bullet Journal symbols, plus common handwriting variations:
          </Typography>
          
          <View style={styles.bulletGrid}>
            {bulletTypes.map((bullet, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={[styles.bulletSymbol, { backgroundColor: bullet.color }]}>
                  <Typography variant="body" style={styles.bulletSymbolText}>{bullet.symbol}</Typography>
                </View>
                <View style={styles.bulletInfo}>
                  <Typography variant="subtitle" style={styles.bulletName}>{bullet.name}</Typography>
                  <Typography variant="caption" style={styles.bulletDescription}>{bullet.description}</Typography>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Entry Type Relationships */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>Entry Type Relationships</Typography>
          <Typography variant="body" style={styles.text}>
            Understanding how different entry types connect and flow into each other is key to mastering 
            the bullet journal methodology. Here's the BuJo Pro hierarchy and relationships:
          </Typography>
          
          {/* The Core Hierarchy */}
          <View style={styles.hierarchyContainer}>
            <Typography variant="subtitle" style={styles.hierarchyTitle}>The Fundamental Hierarchy</Typography>
            
            <View style={styles.hierarchyItem}>
              <View style={styles.hierarchyRank}>
                <Typography variant="caption" style={styles.rankNumber}>1</Typography>
              </View>
              <View style={styles.hierarchyContent}>
                <Typography variant="headline" style={styles.hierarchyItemTitle}>
                  • Tasks - The CORE of BuJo
                </Typography>
                <Typography variant="body" style={styles.hierarchyDescription}>
                  Only actionable entries with full state transitions (complete, migrate, schedule, cancel). 
                  Can spawn from any other entry type.
                </Typography>
                <Typography variant="caption" style={styles.swipeHint}>
                  Swipe actions: Complete, Migrate (>), Schedule, Cancel (✕)
                </Typography>
              </View>
            </View>
            
            <View style={styles.hierarchyItem}>
              <View style={styles.hierarchyRank}>
                <Typography variant="caption" style={styles.rankNumber}>2</Typography>
              </View>
              <View style={styles.hierarchyContent}>
                <Typography variant="headline" style={styles.hierarchyItemTitle}>
                  ○ Events - Time-bound occurrences
                </Typography>
                <Typography variant="body" style={styles.hierarchyDescription}>
                  Immutable once logged (events happen or don't). Often generate follow-up tasks.
                </Typography>
                <Typography variant="caption" style={styles.swipeHint}>
                  Swipe actions: Attend, Add to Calendar, Set Reminder
                </Typography>
              </View>
            </View>
            
            <View style={styles.hierarchyItem}>
              <View style={styles.hierarchyRank}>
                <Typography variant="caption" style={styles.rankNumber}>3</Typography>
              </View>
              <View style={styles.hierarchyContent}>
                <Typography variant="headline" style={styles.hierarchyItemTitle}>
                  —★& Notes + Inspiration + Research
                </Typography>
                <Typography variant="body" style={styles.hierarchyDescription}>
                  Information capture family. Research and Inspiration are specialized notes that 
                  often spawn tasks as ideas develop.
                </Typography>
                <Typography variant="caption" style={styles.swipeHint}>
                  Swipe actions: Convert to Task, Archive, Add to Collection
                </Typography>
              </View>
            </View>
            
            <View style={styles.hierarchyItem}>
              <View style={styles.hierarchyRank}>
                <Typography variant="caption" style={styles.rankNumber}>4</Typography>
              </View>
              <View style={styles.hierarchyContent}>
                <Typography variant="headline" style={styles.hierarchyItemTitle}>
                  ◇ Memory - Reflective practice
                </Typography>
                <Typography variant="body" style={styles.hierarchyDescription}>
                  Gratitude entries and special moments. Modern BuJo addition for wellness. 
                  Standalone reflective practice, may spawn gratitude-related tasks.
                </Typography>
                <Typography variant="caption" style={styles.swipeHint}>
                  Swipe actions: Add Photo, Gratitude Log, Share Memory
                </Typography>
              </View>
            </View>
            
            <View style={styles.hierarchyItem}>
              <View style={styles.hierarchyRank}>
                <Typography variant="caption" style={styles.rankNumber}>5</Typography>
              </View>
              <View style={styles.hierarchyContent}>
                <Typography variant="headline" style={styles.hierarchyItemTitle}>
                  Custom - User-defined signifiers
                </Typography>
                <Typography variant="body" style={styles.hierarchyDescription}>
                  Your personal notation system. Actions depend on your signifier's meaning—
                  could be actionable like tasks or informational like notes.
                </Typography>
                <Typography variant="caption" style={styles.swipeHint}>
                  Swipe actions: Edit, Delete (adapts to your meaning)
                </Typography>
              </View>
            </View>
          </View>
          
          {/* Flow Relationships */}
          <View style={styles.flowContainer}>
            <Typography variant="subtitle" style={styles.flowTitle}>Natural Entry Flow</Typography>
            
            <View style={styles.flowItem}>
              <View style={styles.flowArrow}>
                <Ionicons name="arrow-forward" size={16} color="#007AFF" />
              </View>
              <Typography variant="body" style={styles.flowText}>
                <Typography variant="headline" style={styles.flowSource}>Ideas & Information</Typography> → 
                <Typography variant="headline" style={styles.flowTarget}> Tasks</Typography>
              </Typography>
              <Typography variant="caption" style={styles.flowDescription}>
                Notes, Inspiration, and Research naturally evolve into actionable tasks
              </Typography>
            </View>
            
            <View style={styles.flowItem}>
              <View style={styles.flowArrow}>
                <Ionicons name="arrow-forward" size={16} color="#007AFF" />
              </View>
              <Typography variant="body" style={styles.flowText}>
                <Typography variant="headline" style={styles.flowSource}>Events</Typography> → 
                <Typography variant="headline" style={styles.flowTarget}> Tasks</Typography>
              </Typography>
              <Typography variant="caption" style={styles.flowDescription}>
                Meetings and appointments often generate follow-up actions
              </Typography>
            </View>
            
            <View style={styles.flowItem}>
              <View style={styles.flowArrow}>
                <Ionicons name="remove" size={16} color="#8E8E93" />
              </View>
              <Typography variant="body" style={styles.flowText}>
                <Typography variant="headline" style={styles.flowSource}>Memory</Typography> → 
                <Typography variant="headline" style={styles.flowStandalone}> Standalone</Typography>
              </Typography>
              <Typography variant="caption" style={styles.flowDescription}>
                Reflective practice exists independently for wellness and gratitude
              </Typography>
            </View>
          </View>
        </Card>

        {/* Interactive Examples */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>Interactive Examples</Typography>
          <Typography variant="body" style={styles.text}>
            Tap on each example to see how the app would interpret your handwriting:
          </Typography>

          {/* Daily Log Example */}
          <TouchableOpacity
            style={[
              styles.exampleCard,
              activeExample === 'daily' && styles.activeExampleCard
            ]}
            onPress={() => setActiveExample(activeExample === 'daily' ? null : 'daily')}
          >
            <View style={styles.exampleHeader}>
              <Typography variant="subtitle" style={styles.exampleTitle}>📅 Daily Log Example</Typography>
              <Ionicons 
                name={activeExample === 'daily' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#007AFF" 
              />
            </View>
            
            {activeExample === 'daily' && (
              <View style={styles.exampleContent}>
                <View style={styles.handwritingExample}>
                  <Typography variant="subtitle" style={styles.handwritingTitle}>What you write:</Typography>
                  <Typography variant="body" style={styles.handwritingText}>• Buy groceries @store #food</Typography>
                  <Typography variant="body" style={styles.handwritingText}>○ Meeting with Sarah 2:30pm</Typography>
                  <Typography variant="body" style={styles.handwritingText}>— Great idea for weekend project</Typography>
                  <Typography variant="body" style={styles.handwritingText}>★ Remember to call mom</Typography>
                  <Typography variant="body" style={styles.handwritingText}>& Research React Native performance</Typography>
                  <Typography variant="body" style={styles.handwritingText}>◇ Grateful for sunny weather</Typography>
                </View>
                
                <View style={styles.digitalExample}>
                  <Typography variant="subtitle" style={styles.digitalTitle}>App interprets as:</Typography>
                  <View style={styles.digitalEntry}>
                    <Typography variant="body" style={[styles.bullet, { color: '#007AFF' }]}>•</Typography>
                    <View style={styles.entryDetails}>
                      <Typography variant="body" style={styles.entryText}>Buy groceries</Typography>
                      <View style={styles.entryTags}>
                        <Typography variant="caption" style={styles.contextTag}>@store</Typography>
                        <Typography variant="caption" style={styles.hashTag}>#food</Typography>
                      </View>
                      <Typography variant="caption" style={styles.entryType}>Task • Incomplete</Typography>
                    </View>
                  </View>
                  
                  <View style={styles.digitalEntry}>
                    <Typography variant="body" style={[styles.bullet, { color: '#FF3B30' }]}>○</Typography>
                    <View style={styles.entryDetails}>
                      <Typography variant="body" style={styles.entryText}>Meeting with Sarah 2:30pm</Typography>
                      <Typography variant="caption" style={styles.entryType}>Event • 2:30 PM</Typography>
                    </View>
                  </View>
                  
                  <View style={styles.digitalEntry}>
                    <Typography variant="body" style={[styles.bullet, { color: '#32D74B' }]}>—</Typography>
                    <View style={styles.entryDetails}>
                      <Typography variant="body" style={styles.entryText}>Great idea for weekend project</Typography>
                      <Typography variant="caption" style={styles.entryType}>Note</Typography>
                    </View>
                  </View>

                  <View style={styles.digitalEntry}>
                    <Typography variant="body" style={[styles.bullet, { color: '#FFD60A' }]}>★</Typography>
                    <View style={styles.entryDetails}>
                      <Typography variant="body" style={styles.entryText}>Remember to call mom</Typography>
                      <Typography variant="caption" style={styles.entryType}>Inspiration</Typography>
                    </View>
                  </View>

                  <View style={styles.digitalEntry}>
                    <Typography variant="body" style={[styles.bullet, { color: '#5856D6' }]}>& </Typography>
                    <View style={styles.entryDetails}>
                      <Typography variant="body" style={styles.entryText}>Research React Native performance</Typography>
                      <Typography variant="caption" style={styles.entryType}>Research</Typography>
                    </View>
                  </View>

                  <View style={styles.digitalEntry}>
                    <Typography variant="body" style={[styles.bullet, { color: '#FF2D55' }]}>◇</Typography>
                    <View style={styles.entryDetails}>
                      <Typography variant="body" style={styles.entryText}>Grateful for sunny weather</Typography>
                      <Typography variant="caption" style={styles.entryType}>Memory • Gratitude</Typography>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Migration Example */}
          <TouchableOpacity
            style={[
              styles.exampleCard,
              activeExample === 'migration' && styles.activeExampleCard
            ]}
            onPress={() => setActiveExample(activeExample === 'migration' ? null : 'migration')}
          >
            <View style={styles.exampleHeader}>
              <Typography variant="subtitle" style={styles.exampleTitle}>🔄 Migration Example</Typography>
              <Ionicons 
                name={activeExample === 'migration' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#007AFF" 
              />
            </View>
            
            {activeExample === 'migration' && (
              <View style={styles.exampleContent}>
                <View style={styles.handwritingExample}>
                  <Typography variant="subtitle" style={styles.handwritingTitle}>Monthly review notation:</Typography>
                  <Typography variant="body" style={styles.handwritingText}>X Finish quarterly report</Typography>
                  <Typography variant="body" style={styles.handwritingText}>{'> Plan vacation for summer'}</Typography>
                  <Typography variant="body" style={styles.handwritingText}>{'< Doctor appointment'}</Typography>
                  <Typography variant="body" style={styles.handwritingText}>~ Old project idea</Typography>
                </View>
                
                <View style={styles.digitalExample}>
                  <Typography variant="subtitle" style={styles.digitalTitle}>App understands:</Typography>
                  <View style={styles.migrationGrid}>
                    <View style={styles.migrationItem}>
                      <Typography variant="body" style={[styles.bullet, { color: '#34C759' }]}>X</Typography>
                      <Typography variant="caption" style={styles.migrationLabel}>Completed ✓</Typography>
                    </View>
                    <View style={styles.migrationItem}>
                      <Typography variant="body" style={[styles.bullet, { color: '#FF9500' }]}>{'>'}</Typography>
                      <Typography variant="caption" style={styles.migrationLabel}>Migrated to next month</Typography>
                    </View>
                    <View style={styles.migrationItem}>
                      <Typography variant="body" style={[styles.bullet, { color: '#5856D6' }]}>{'<'}</Typography>
                      <Typography variant="caption" style={styles.migrationLabel}>Scheduled for future</Typography>
                    </View>
                    <View style={styles.migrationItem}>
                      <Typography variant="body" style={[styles.bullet, { color: '#8E8E93' }]}>~</Typography>
                      <Typography variant="caption" style={styles.migrationLabel}>Irrelevant/cancelled</Typography>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Collections Example */}
          <TouchableOpacity
            style={[
              styles.exampleCard,
              activeExample === 'collections' && styles.activeExampleCard
            ]}
            onPress={() => setActiveExample(activeExample === 'collections' ? null : 'collections')}
          >
            <View style={styles.exampleHeader}>
              <Typography variant="subtitle" style={styles.exampleTitle}>📚 Collections & Tags</Typography>
              <Ionicons 
                name={activeExample === 'collections' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#007AFF" 
              />
            </View>
            
            {activeExample === 'collections' && (
              <View style={styles.exampleContent}>
                <View style={styles.handwritingExample}>
                  <Typography variant="subtitle" style={styles.handwritingTitle}>Your notation system:</Typography>
                  <Typography variant="body" style={styles.handwritingText}>• Read "Atomic Habits" @home #books #growth</Typography>
                  <Typography variant="body" style={styles.handwritingText}>• Workout routine @gym #fitness #morning</Typography>
                  <Typography variant="body" style={styles.handwritingText}>○ Team standup @office #work</Typography>
                </View>
                
                <View style={styles.digitalExample}>
                  <Typography variant="subtitle" style={styles.digitalTitle}>Smart organization:</Typography>
                  <View style={styles.organizationGrid}>
                    <View style={styles.orgItem}>
                      <Typography variant="subtitle" style={styles.orgTitle}>Contexts (@)</Typography>
                      <Typography variant="body" style={styles.orgList}>@home, @gym, @office</Typography>
                    </View>
                    <View style={styles.orgItem}>
                      <Typography variant="subtitle" style={styles.orgTitle}>Topics (#)</Typography>
                      <Typography variant="body" style={styles.orgList}>#books, #fitness, #work</Typography>
                    </View>
                    <View style={styles.orgItem}>
                      <Typography variant="subtitle" style={styles.orgTitle}>Auto-Collections</Typography>
                      <Typography variant="body" style={styles.orgList}>Personal Growth, Health & Fitness</Typography>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Card>

        {/* App Features Guide */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>Using This App</Typography>
          
          <View style={styles.featureGrid}>
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="camera" size={24} color="#007AFF" />
              </View>
              <Typography variant="subtitle" style={styles.featureTitle}>Quick Scan</Typography>
              <Typography variant="body" style={styles.featureDescription}>
                Tap the camera icon to quickly capture and process your journal pages
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Collections')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="library" size={24} color="#FF9500" />
              </View>
              <Typography variant="subtitle" style={styles.featureTitle}>Collections</Typography>
              <Typography variant="body" style={styles.featureDescription}>
                Organize entries by month, project, or custom categories
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#E8F5E8' }]}>
                <Ionicons name="sync" size={24} color="#34C759" />
              </View>
              <Typography variant="subtitle" style={styles.featureTitle}>Smart Sync</Typography>
              <Typography variant="body" style={styles.featureDescription}>
                Tasks automatically sync to Reminders, events to Calendar
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="search" size={24} color="#E91E63" />
              </View>
              <Typography variant="subtitle" style={styles.featureTitle}>Smart Search</Typography>
              <Typography variant="body" style={styles.featureDescription}>
                Find entries by text, tags, contexts, or date ranges
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Getting Started */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>Getting Started</Typography>
          
          <View style={styles.gettingStartedList}>
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Typography variant="headline" style={styles.stepBadgeText}>1</Typography>
              </View>
              <View style={styles.stepInfo}>
                <Typography variant="headline" style={styles.stepInfoTitle}>Write Your First Page</Typography>
                <Typography variant="body" style={styles.stepInfoText}>
                  Use standard bullet journal notation in your physical journal
                </Typography>
              </View>
            </View>
            
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Typography variant="headline" style={styles.stepBadgeText}>2</Typography>
              </View>
              <View style={styles.stepInfo}>
                <Typography variant="headline" style={styles.stepInfoTitle}>Scan with Camera</Typography>
                <Typography variant="body" style={styles.stepInfoText}>
                  Tap the camera icon and capture your page in good lighting
                </Typography>
              </View>
            </View>
            
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Typography variant="headline" style={styles.stepBadgeText}>3</Typography>
              </View>
              <View style={styles.stepInfo}>
                <Typography variant="headline" style={styles.stepInfoTitle}>Review Results</Typography>
                <Typography variant="body" style={styles.stepInfoText}>
                  Check the detected entries and make any quick corrections
                </Typography>
              </View>
            </View>
            
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Typography variant="headline" style={styles.stepBadgeText}>4</Typography>
              </View>
              <View style={styles.stepInfo}>
                <Typography variant="headline" style={styles.stepInfoTitle}>Enjoy Digital Benefits</Typography>
                <Typography variant="body" style={styles.stepInfoText}>
                  Search, organize, and sync while keeping your analog workflow
                </Typography>
              </View>
            </View>
          </View>
        </Card>

        {/* OCR Tips */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>Tips for Best Results</Typography>
          
          <View style={styles.tipItem}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <View style={styles.tipContent}>
              <Typography variant="headline" style={styles.tipTitle}>Write Clearly</Typography>
              <Typography variant="body" style={styles.tipText}>
                Make your bullets distinct and leave space between symbol and text
              </Typography>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="sunny-outline" size={20} color="#007AFF" />
            <View style={styles.tipContent}>
              <Typography variant="headline" style={styles.tipTitle}>Good Lighting</Typography>
              <Typography variant="body" style={styles.tipText}>
                Scan in bright, even light to help the camera capture details
              </Typography>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="crop-outline" size={20} color="#007AFF" />
            <View style={styles.tipContent}>
              <Typography variant="headline" style={styles.tipTitle}>Frame Your Page</Typography>
              <Typography variant="body" style={styles.tipText}>
                Keep the entire page visible and minimize shadows
              </Typography>
            </View>
          </View>
        </Card>

        {/* Philosophy */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Typography variant="title" style={styles.sectionTitle}>The BuJo Pro Philosophy</Typography>
          <Typography variant="body" style={styles.text}>
            Bullet journaling works because it's tactile, immediate, and personal. This app doesn't 
            try to replace that—it enhances it. Your paper journal remains your primary system, 
            while this app helps you get the benefits of digital organization without losing the 
            analog experience you love.
          </Typography>
          
          <View style={styles.philosophyGrid}>
            <View style={styles.philosophyItem}>
              <Typography variant="headline" style={styles.philosophyTitle}>📝 Paper First</Typography>
              <Typography variant="body" style={styles.philosophyText}>
                Your handwritten journal is always the source of truth
              </Typography>
            </View>
            
            <View style={styles.philosophyItem}>
              <Typography variant="headline" style={styles.philosophyTitle}>🔄 Seamless Sync</Typography>
              <Typography variant="body" style={styles.philosophyText}>
                Digital tools work with your system, not against it
              </Typography>
            </View>
            
            <View style={styles.philosophyItem}>
              <Typography variant="headline" style={styles.philosophyTitle}>⚡ Quick Capture</Typography>
              <Typography variant="body" style={styles.philosophyText}>
                Fast scanning and minimal review keeps you flowing
              </Typography>
            </View>
            
            <View style={styles.philosophyItem}>
              <Typography variant="headline" style={styles.philosophyTitle}>🎯 Respect Method</Typography>
              <Typography variant="body" style={styles.philosophyText}>
                Official BuJo notation preserved exactly as you write it
              </Typography>
            </View>
          </View>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.md,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  section: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  sectionTitle: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  text: {
    lineHeight: 24,
  },
  stepContainer: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  step: {
    flexDirection: 'row',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F2A44', // Paper ink primary color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.lg,
    marginTop: 2,
  },
  stepNumberText: {
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  stepText: {
    lineHeight: 22,
  },
  bulletGrid: {
    marginTop: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bulletSymbol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bulletSymbolText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulletInfo: {
    flex: 1,
  },
  bulletName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  bulletDescription: {
    fontSize: 15,
    color: '#8E8E93',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 16,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#8E8E93',
  },
  philosophyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 16,
  },
  philosophyItem: {
    width: '48%',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  philosophyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  philosophyText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#8E8E93',
  },
  // New styles for interactive examples
  exampleCard: {
    marginTop: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeExampleCard: {
    backgroundColor: '#E3F2FD',
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  exampleContent: {
    padding: 16,
    paddingTop: 0,
  },
  handwritingExample: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  handwritingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  handwritingText: {
    fontSize: 16,
    fontFamily: 'Courier New',
    color: '#424242',
    lineHeight: 24,
    marginBottom: 4,
  },
  digitalExample: {
    backgroundColor: '#F1F8E9',
    padding: 12,
    borderRadius: 8,
  },
  digitalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#388E3C',
    marginBottom: 12,
  },
  digitalEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  entryDetails: {
    flex: 1,
    marginLeft: 12,
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  entryTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  contextTag: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hashTag: {
    backgroundColor: '#E8F5E8',
    color: '#388E3C',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entryType: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  migrationGrid: {
    gap: 12,
  },
  migrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  migrationLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#1C1C1E',
  },
  organizationGrid: {
    gap: 8,
  },
  orgItem: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  orgTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  orgList: {
    fontSize: 13,
    color: '#757575',
  },
  // Feature grid styles
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Getting started styles
  gettingStartedList: {
    gap: 16,
    marginTop: 16,
  },
  gettingStartedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepInfo: {
    flex: 1,
  },
  stepInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  stepInfoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  // Hierarchy Styles
  hierarchyContainer: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  hierarchyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  hierarchyItem: {
    flexDirection: 'row',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
    alignItems: 'flex-start',
  },
  hierarchyRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.md,
    marginTop: 2,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hierarchyContent: {
    flex: 1,
  },
  hierarchyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  hierarchyDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  swipeHint: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  // Flow Styles
  flowContainer: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingTop: PAPER_DESIGN_TOKENS.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  flowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  flowArrow: {
    marginRight: PAPER_DESIGN_TOKENS.spacing.md,
    marginTop: 2,
  },
  flowText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  flowSource: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
  flowTarget: {
    fontWeight: '600',
    color: '#007AFF',
  },
  flowStandalone: {
    fontWeight: '600',
    color: '#8E8E93',
  },
  flowDescription: {
    fontSize: 13,
    color: '#666666',
    marginTop: PAPER_DESIGN_TOKENS.spacing.xs,
    fontStyle: 'italic',
  },
});