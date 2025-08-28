import React from 'react';
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
});