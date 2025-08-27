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

export const CollectionsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Collections</Text>
        <Text style={styles.subtitle}>
          Organize your bullet journal entries by month, project, or custom collections
        </Text>

        {/* Collection Types */}
        <View style={styles.collectionsContainer}>
          <TouchableOpacity style={styles.collectionCard}>
            <View style={styles.collectionIcon}>
              <Ionicons name="today-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.collectionContent}>
              <Text style={styles.collectionTitle}>Monthly Log</Text>
              <Text style={styles.collectionSubtitle}>Overview of the current month</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.collectionCard}>
            <View style={styles.collectionIcon}>
              <Ionicons name="calendar-outline" size={24} color="#FF9500" />
            </View>
            <View style={styles.collectionContent}>
              <Text style={styles.collectionTitle}>Future Log</Text>
              <Text style={styles.collectionSubtitle}>Long-term planning and events</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.collectionCard}>
            <View style={styles.collectionIcon}>
              <Ionicons name="folder-outline" size={24} color="#34C759" />
            </View>
            <View style={styles.collectionContent}>
              <Text style={styles.collectionTitle}>Custom Collections</Text>
              <Text style={styles.collectionSubtitle}>Project trackers and special pages</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.collectionCard}>
            <View style={styles.collectionIcon}>
              <Ionicons name="search-outline" size={24} color="#FF3B30" />
            </View>
            <View style={styles.collectionContent}>
              <Text style={styles.collectionTitle}>Index</Text>
              <Text style={styles.collectionSubtitle}>Search and find entries</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Recent Collections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Collections</Text>
          <View style={styles.recentList}>
            <Text style={styles.emptyText}>No recent collections</Text>
            <Text style={styles.emptySubtext}>
              Your monthly logs and custom collections will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 32,
  },
  collectionsContainer: {
    marginBottom: 32,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectionContent: {
    flex: 1,
  },
  collectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  collectionSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  recentList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 20,
  },
});