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
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card } from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface CollectionsScreenProps {
  navigation: any;
}

export const CollectionsScreen: React.FC<CollectionsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  const collections = [
    {
      title: 'Monthly Log',
      subtitle: 'Overview of the current month',
      icon: 'today-outline' as const,
      color: safeThemeAccess(theme, t => t.colors.bujo?.event, '#0F2A44'), // Fountain pen blue
      backgroundColor: 'rgba(15, 42, 68, 0.1)',
      route: 'MonthlyLog'
    },
    {
      title: 'Future Log',
      subtitle: 'Long-term planning and events',
      icon: 'calendar-outline' as const,
      color: safeThemeAccess(theme, t => t.colors.bujo?.taskMigrated, '#D97706'), // Orange ink
      backgroundColor: 'rgba(217, 119, 6, 0.1)',
      route: 'FutureLog'
    },
    {
      title: 'Custom Collections',
      subtitle: 'Project trackers and special pages',
      icon: 'folder-outline' as const,
      color: safeThemeAccess(theme, t => t.colors.bujo?.taskComplete, '#15803D'), // Forest green
      backgroundColor: 'rgba(21, 128, 61, 0.1)',
      route: 'CustomCollections'
    },
    {
      title: 'Memory Log',
      subtitle: 'Gratitude journaling and memories',
      icon: 'heart-outline' as const,
      color: safeThemeAccess(theme, t => t.colors.bujo?.memory, '#BE185D'), // Magenta ink
      backgroundColor: 'rgba(190, 24, 93, 0.1)',
      route: 'MemoryLog'
    },
    {
      title: 'Index',
      subtitle: 'Search and find entries',
      icon: 'search-outline' as const,
      color: safeThemeAccess(theme, t => t.colors.bujo?.research, '#7C3AED'), // Purple ink
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      route: 'Index'
    }
  ];

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Typography variant="largeTitle" color="text" style={styles.title}>Collections</Typography>
          <Typography variant="callout" color="textSecondary" style={styles.subtitle}>
            Organize your bullet journal entries by month, project, or custom collections
          </Typography>

          {/* Collection Types */}
          <View style={styles.collectionsContainer}>
            {collections.map((collection, index) => (
              <Card key={index} variant="elevated" padding="lg" style={styles.collectionCard}>
                <TouchableOpacity 
                  style={styles.collectionTouchable}
                  onPress={() => navigation.navigate(collection.route)}
                >
                  <View style={[
                    styles.collectionIcon,
                    { backgroundColor: collection.backgroundColor }
                  ]}>
                    <Ionicons name={collection.icon} size={24} color={collection.color} />
                  </View>
                  <View style={styles.collectionContent}>
                    <Typography variant="headline" color="text">{collection.title}</Typography>
                    <Typography variant="subheadline" color="textSecondary">{collection.subtitle}</Typography>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={safeThemeAccess(theme, t => t.colors.textTertiary, '#C7C7CC')} 
                  />
                </TouchableOpacity>
              </Card>
            ))}
          </View>

          {/* Recent Collections */}
          <View style={styles.section}>
            <Typography variant="title2" color="text" style={styles.sectionTitle}>Recent Collections</Typography>
            <Card variant="elevated" padding="xl" style={styles.recentList}>
              <Typography variant="headline" color="textSecondary" style={styles.emptyText}>No recent collections</Typography>
              <Typography variant="subheadline" color="textTertiary" style={styles.emptySubtext}>
                Your monthly logs and custom collections will appear here
              </Typography>
            </Card>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: 32,
  },
  collectionsContainer: {
    marginBottom: 32,
  },
  collectionCard: {
    marginBottom: 12,
  },
  collectionTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectionContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  recentList: {
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    lineHeight: 20,
  },
});