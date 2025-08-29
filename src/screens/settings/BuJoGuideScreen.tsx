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

interface BuJoGuideScreenProps {
  navigation: any;
}

export const BuJoGuideScreen: React.FC<BuJoGuideScreenProps> = ({ navigation }) => {
  const [activeExample, setActiveExample] = useState<string | null>(null);
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
      symbol: '!',
      name: 'Idea',
      description: 'Inspiration or brilliant thought',
      color: '#FFD60A',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bullet Journal Guide</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Digital Enhancement, Not Replacement</Text>
          <Text style={styles.text}>
            This app preserves your handwritten bullet journal system while adding digital convenience. 
            Scan your pages, review the results, and sync with your digital tools—all while keeping 
            paper as your source of truth.
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Scan Your Page</Text>
                <Text style={styles.stepText}>
                  Use the camera to capture your handwritten bullet journal entries
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>AI Recognition</Text>
                <Text style={styles.stepText}>
                  Advanced OCR detects your bullets and understands your notation
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Quick Review</Text>
                <Text style={styles.stepText}>
                  Confirm what was detected or make quick corrections
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Digital Sync</Text>
                <Text style={styles.stepText}>
                  Tasks sync to Reminders, events to Calendar automatically
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bullet Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bullet Journal Notation</Text>
          <Text style={styles.text}>
            The app recognizes all official Bullet Journal symbols, plus common handwriting variations:
          </Text>
          
          <View style={styles.bulletGrid}>
            {bulletTypes.map((bullet, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={[styles.bulletSymbol, { backgroundColor: bullet.color }]}>
                  <Text style={styles.bulletSymbolText}>{bullet.symbol}</Text>
                </View>
                <View style={styles.bulletInfo}>
                  <Text style={styles.bulletName}>{bullet.name}</Text>
                  <Text style={styles.bulletDescription}>{bullet.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Interactive Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Examples</Text>
          <Text style={styles.text}>
            Tap on each example to see how the app would interpret your handwriting:
          </Text>

          {/* Daily Log Example */}
          <TouchableOpacity
            style={[
              styles.exampleCard,
              activeExample === 'daily' && styles.activeExampleCard
            ]}
            onPress={() => setActiveExample(activeExample === 'daily' ? null : 'daily')}
          >
            <View style={styles.exampleHeader}>
              <Text style={styles.exampleTitle}>📅 Daily Log Example</Text>
              <Ionicons 
                name={activeExample === 'daily' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#007AFF" 
              />
            </View>
            
            {activeExample === 'daily' && (
              <View style={styles.exampleContent}>
                <View style={styles.handwritingExample}>
                  <Text style={styles.handwritingTitle}>What you write:</Text>
                  <Text style={styles.handwritingText}>• Buy groceries @store #food</Text>
                  <Text style={styles.handwritingText}>○ Meeting with Sarah 2:30pm</Text>
                  <Text style={styles.handwritingText}>— Great idea for weekend project</Text>
                  <Text style={styles.handwritingText}>! Remember to call mom</Text>
                </View>
                
                <View style={styles.digitalExample}>
                  <Text style={styles.digitalTitle}>App interprets as:</Text>
                  <View style={styles.digitalEntry}>
                    <Text style={[styles.bullet, { color: '#007AFF' }]}>•</Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryText}>Buy groceries</Text>
                      <View style={styles.entryTags}>
                        <Text style={styles.contextTag}>@store</Text>
                        <Text style={styles.hashTag}>#food</Text>
                      </View>
                      <Text style={styles.entryType}>Task • Incomplete</Text>
                    </View>
                  </View>
                  
                  <View style={styles.digitalEntry}>
                    <Text style={[styles.bullet, { color: '#FF3B30' }]}>○</Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryText}>Meeting with Sarah 2:30pm</Text>
                      <Text style={styles.entryType}>Event • 2:30 PM</Text>
                    </View>
                  </View>
                  
                  <View style={styles.digitalEntry}>
                    <Text style={[styles.bullet, { color: '#32D74B' }]}>—</Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryText}>Great idea for weekend project</Text>
                      <Text style={styles.entryType}>Note</Text>
                    </View>
                  </View>

                  <View style={styles.digitalEntry}>
                    <Text style={[styles.bullet, { color: '#FFD60A' }]}>!</Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryText}>Remember to call mom</Text>
                      <Text style={styles.entryType}>Idea</Text>
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
              <Text style={styles.exampleTitle}>🔄 Migration Example</Text>
              <Ionicons 
                name={activeExample === 'migration' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#007AFF" 
              />
            </View>
            
            {activeExample === 'migration' && (
              <View style={styles.exampleContent}>
                <View style={styles.handwritingExample}>
                  <Text style={styles.handwritingTitle}>Monthly review notation:</Text>
                  <Text style={styles.handwritingText}>X Finish quarterly report</Text>
                  <Text style={styles.handwritingText}>{'> Plan vacation for summer'}</Text>
                  <Text style={styles.handwritingText}>{'< Doctor appointment'}</Text>
                  <Text style={styles.handwritingText}>~ Old project idea</Text>
                </View>
                
                <View style={styles.digitalExample}>
                  <Text style={styles.digitalTitle}>App understands:</Text>
                  <View style={styles.migrationGrid}>
                    <View style={styles.migrationItem}>
                      <Text style={[styles.bullet, { color: '#34C759' }]}>X</Text>
                      <Text style={styles.migrationLabel}>Completed ✓</Text>
                    </View>
                    <View style={styles.migrationItem}>
                      <Text style={[styles.bullet, { color: '#FF9500' }]}>{'>'}</Text>
                      <Text style={styles.migrationLabel}>Migrated to next month</Text>
                    </View>
                    <View style={styles.migrationItem}>
                      <Text style={[styles.bullet, { color: '#5856D6' }]}>{'<'}</Text>
                      <Text style={styles.migrationLabel}>Scheduled for future</Text>
                    </View>
                    <View style={styles.migrationItem}>
                      <Text style={[styles.bullet, { color: '#8E8E93' }]}>~</Text>
                      <Text style={styles.migrationLabel}>Irrelevant/cancelled</Text>
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
              <Text style={styles.exampleTitle}>📚 Collections & Tags</Text>
              <Ionicons 
                name={activeExample === 'collections' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#007AFF" 
              />
            </View>
            
            {activeExample === 'collections' && (
              <View style={styles.exampleContent}>
                <View style={styles.handwritingExample}>
                  <Text style={styles.handwritingTitle}>Your notation system:</Text>
                  <Text style={styles.handwritingText}>• Read "Atomic Habits" @home #books #growth</Text>
                  <Text style={styles.handwritingText}>• Workout routine @gym #fitness #morning</Text>
                  <Text style={styles.handwritingText}>○ Team standup @office #work</Text>
                </View>
                
                <View style={styles.digitalExample}>
                  <Text style={styles.digitalTitle}>Smart organization:</Text>
                  <View style={styles.organizationGrid}>
                    <View style={styles.orgItem}>
                      <Text style={styles.orgTitle}>Contexts (@)</Text>
                      <Text style={styles.orgList}>@home, @gym, @office</Text>
                    </View>
                    <View style={styles.orgItem}>
                      <Text style={styles.orgTitle}>Topics (#)</Text>
                      <Text style={styles.orgList}>#books, #fitness, #work</Text>
                    </View>
                    <View style={styles.orgItem}>
                      <Text style={styles.orgTitle}>Auto-Collections</Text>
                      <Text style={styles.orgList}>Personal Growth, Health & Fitness</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* App Features Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Using This App</Text>
          
          <View style={styles.featureGrid}>
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="camera" size={24} color="#007AFF" />
              </View>
              <Text style={styles.featureTitle}>Quick Scan</Text>
              <Text style={styles.featureDescription}>
                Tap the camera icon to quickly capture and process your journal pages
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Collections')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="library" size={24} color="#FF9500" />
              </View>
              <Text style={styles.featureTitle}>Collections</Text>
              <Text style={styles.featureDescription}>
                Organize entries by month, project, or custom categories
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#E8F5E8' }]}>
                <Ionicons name="sync" size={24} color="#34C759" />
              </View>
              <Text style={styles.featureTitle}>Smart Sync</Text>
              <Text style={styles.featureDescription}>
                Tasks automatically sync to Reminders, events to Calendar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="search" size={24} color="#E91E63" />
              </View>
              <Text style={styles.featureTitle}>Smart Search</Text>
              <Text style={styles.featureDescription}>
                Find entries by text, tags, contexts, or date ranges
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Getting Started */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          
          <View style={styles.gettingStartedList}>
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepInfoTitle}>Write Your First Page</Text>
                <Text style={styles.stepInfoText}>
                  Use standard bullet journal notation in your physical journal
                </Text>
              </View>
            </View>
            
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepInfoTitle}>Scan with Camera</Text>
                <Text style={styles.stepInfoText}>
                  Tap the camera icon and capture your page in good lighting
                </Text>
              </View>
            </View>
            
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepInfoTitle}>Review Results</Text>
                <Text style={styles.stepInfoText}>
                  Check the detected entries and make any quick corrections
                </Text>
              </View>
            </View>
            
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>4</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepInfoTitle}>Enjoy Digital Benefits</Text>
                <Text style={styles.stepInfoText}>
                  Search, organize, and sync while keeping your analog workflow
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* OCR Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Best Results</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Write Clearly</Text>
              <Text style={styles.tipText}>
                Make your bullets distinct and leave space between symbol and text
              </Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="sunny-outline" size={20} color="#007AFF" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Good Lighting</Text>
              <Text style={styles.tipText}>
                Scan in bright, even light to help the camera capture details
              </Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="crop-outline" size={20} color="#007AFF" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Frame Your Page</Text>
              <Text style={styles.tipText}>
                Keep the entire page visible and minimize shadows
              </Text>
            </View>
          </View>
        </View>

        {/* Philosophy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The BuJo Pro Philosophy</Text>
          <Text style={styles.text}>
            Bullet journaling works because it's tactile, immediate, and personal. This app doesn't 
            try to replace that—it enhances it. Your paper journal remains your primary system, 
            while this app helps you get the benefits of digital organization without losing the 
            analog experience you love.
          </Text>
          
          <View style={styles.philosophyGrid}>
            <View style={styles.philosophyItem}>
              <Text style={styles.philosophyTitle}>📝 Paper First</Text>
              <Text style={styles.philosophyText}>
                Your handwritten journal is always the source of truth
              </Text>
            </View>
            
            <View style={styles.philosophyItem}>
              <Text style={styles.philosophyTitle}>🔄 Seamless Sync</Text>
              <Text style={styles.philosophyText}>
                Digital tools work with your system, not against it
              </Text>
            </View>
            
            <View style={styles.philosophyItem}>
              <Text style={styles.philosophyTitle}>⚡ Quick Capture</Text>
              <Text style={styles.philosophyText}>
                Fast scanning and minimal review keeps you flowing
              </Text>
            </View>
            
            <View style={styles.philosophyItem}>
              <Text style={styles.philosophyTitle}>🎯 Respect Method</Text>
              <Text style={styles.philosophyText}>
                Official BuJo notation preserved exactly as you write it
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C1C1E',
  },
  stepContainer: {
    marginTop: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#8E8E93',
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
});