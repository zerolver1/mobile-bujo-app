import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry, BuJoCollection } from '../../types/BuJo';

interface CustomCollectionsScreenProps {
  navigation: any;
}

export const CustomCollectionsScreen: React.FC<CustomCollectionsScreenProps> = ({ navigation }) => {
  const { 
    entries, 
    getCustomCollections,
    addCustomCollection,
    updateCollection,
    deleteCustomCollection,
    getEntriesByCollection
  } = useBuJoStore();
  
  const [collections, setCollections] = useState<BuJoCollection[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<BuJoCollection | null>(null);
  
  // Load custom collections on component mount
  useEffect(() => {
    setCollections(getCustomCollections());
  }, []);
  
  // Refresh collections when store changes
  useEffect(() => {
    setCollections(getCustomCollections());
  }, [entries]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007AFF',
    date: new Date().toISOString().split('T')[0],
  });

  const colors = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
    '#5856D6', '#AF52DE', '#FF2D92', '#A2845E',
    '#8E8E93', '#000000'
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#007AFF',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingCollection(null);
  };

  const handleCreateCollection = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    if (editingCollection) {
      updateCollection(editingCollection.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        modifiedAt: new Date()
      });
    } else {
      addCustomCollection(formData);
    }

    resetForm();
    setShowCreateModal(false);
    
    // Refresh collections list
    setCollections(getCustomCollections());
  };

  const handleEditCollection = (collection: BuJoCollection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name || '',
      description: collection.description || '',
      color: collection.color || '#007AFF',
      date: collection.date,
    });
    setShowCreateModal(true);
  };

  const handleDeleteCollection = (collection: BuJoCollection) => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteCustomCollection(collection.id);
            setCollections(getCustomCollections());
          }
        }
      ]
    );
  };

  const getCollectionEntries = (collection: BuJoCollection): BuJoEntry[] => {
    // Get assigned entries first
    let collectionEntries = getEntriesByCollection(collection.id);
    
    // If smart matching is enabled and no manually assigned entries, use smart matching
    if (collection.smartMatch && collectionEntries.length === 0 && collection.name) {
      collectionEntries = entries.filter(entry => 
        entry.tags.some(tag => tag.toLowerCase().includes(collection.name!.toLowerCase())) ||
        entry.contexts.some(ctx => ctx.toLowerCase().includes(collection.name!.toLowerCase()))
      );
    }
    
    return collectionEntries.slice(0, 3); // Show only first 3 for preview
  };

  const renderCollectionCard = (collection: BuJoCollection) => {
    const collectionEntries = getCollectionEntries(collection);

    return (
      <TouchableOpacity
        key={collection.id}
        style={styles.collectionCard}
        onPress={() => {
          navigation.navigate('CollectionDetail', { collection });
        }}
      >
        <View style={styles.collectionHeader}>
          <View style={styles.collectionTitleRow}>
            <View 
              style={[
                styles.collectionColorDot, 
                { backgroundColor: collection.color }
              ]} 
            />
            <Text style={styles.collectionTitle}>{collection.name}</Text>
          </View>
          <View style={styles.collectionActions}>
            <TouchableOpacity
              onPress={() => handleEditCollection(collection)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil" size={18} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteCollection(collection)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.collectionDescription}>
          {collection.description}
        </Text>

        <View style={styles.collectionStats}>
          <Text style={styles.entryCount}>
            {collectionEntries.length} entries
          </Text>
          <Text style={styles.createdDate}>
            Created {collection.createdAt.toLocaleDateString()}
          </Text>
        </View>

        {collectionEntries.length > 0 && (
          <View style={styles.entriesPreview}>
            <Text style={styles.previewTitle}>Recent Entries:</Text>
            {collectionEntries.map((entry) => (
              <View key={entry.id} style={styles.previewEntry}>
                <Text style={[styles.bullet, { color: collection.color }]}>
                  {entry.type === 'task' ? (entry.status === 'complete' ? '✓' : '•') :
                   entry.type === 'event' ? '○' : '—'}
                </Text>
                <Text style={styles.previewText} numberOfLines={1}>
                  {entry.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        resetForm();
        setShowCreateModal(false);
      }}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setShowCreateModal(false);
            }}
          >
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingCollection ? 'Edit Collection' : 'New Collection'}
          </Text>
          <TouchableOpacity onPress={handleCreateCollection}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Collection name"
              autoFocus
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Brief description (optional)"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    formData.color === color && styles.selectedColor
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Collections</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.subtitle}>
          Organize your entries by projects, goals, or any custom categories
        </Text>

        <View style={styles.collectionsContainer}>
          {collections.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No Collections Yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first collection to organize your bullet journal entries
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.createFirstButtonText}>Create Collection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            collections.map(renderCollectionCard)
          )}
        </View>
      </ScrollView>

      {renderCreateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  collectionsContainer: {
    gap: 16,
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  collectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collectionColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  collectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  collectionDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 16,
  },
  collectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginBottom: 12,
  },
  entryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  createdDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  entriesPreview: {
    gap: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  previewEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#1C1C1E',
  },
});