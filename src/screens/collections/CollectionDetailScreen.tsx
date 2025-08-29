import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry, BuJoCollection } from '../../types/BuJo';

interface CollectionDetailScreenProps {
  navigation: any;
  route: {
    params: {
      collection: BuJoCollection;
    };
  };
}

interface EntryWithSelection extends BuJoEntry {
  isSelected: boolean;
}

export const CollectionDetailScreen: React.FC<CollectionDetailScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { collection } = route.params;
  const { 
    entries, 
    updateCollection,
    getEntriesByCollection 
  } = useBuJoStore();
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [entriesWithSelection, setEntriesWithSelection] = useState<EntryWithSelection[]>([]);
  const [collectionEntries, setCollectionEntries] = useState<BuJoEntry[]>([]);

  useEffect(() => {
    // Get current collection entries
    const currentEntries = getEntriesByCollection(collection.id);
    setCollectionEntries(currentEntries);
    
    // Prepare all entries with selection state for assignment modal
    const entriesWithSelectionState = entries.map(entry => ({
      ...entry,
      isSelected: collection.entryIds?.includes(entry.id) || false
    }));
    setEntriesWithSelection(entriesWithSelectionState);
  }, [entries, collection]);

  const handleAssignEntries = () => {
    const selectedEntryIds = entriesWithSelection
      .filter(entry => entry.isSelected)
      .map(entry => entry.id);
    
    updateCollection(collection.id, {
      entryIds: selectedEntryIds
    });
    
    setShowAssignModal(false);
    
    // Refresh collection entries
    const updatedEntries = entries.filter(entry => selectedEntryIds.includes(entry.id));
    setCollectionEntries(updatedEntries);
  };

  const toggleEntrySelection = (entryId: string) => {
    setEntriesWithSelection(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, isSelected: !entry.isSelected }
          : entry
      )
    );
  };

  const removeEntryFromCollection = (entryId: string) => {
    Alert.alert(
      'Remove Entry',
      'Remove this entry from the collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedEntryIds = (collection.entryIds || []).filter(id => id !== entryId);
            updateCollection(collection.id, { entryIds: updatedEntryIds });
            
            // Refresh collection entries
            setCollectionEntries(prev => prev.filter(entry => entry.id !== entryId));
          }
        }
      ]
    );
  };

  const renderEntryItem = ({ item, showRemove = false }: { item: BuJoEntry; showRemove?: boolean }) => (
    <View style={styles.entryContainer}>
      <View style={styles.bulletContainer}>
        <Text style={styles.bullet}>
          {item.type === 'task' && item.status === 'complete' ? '✓' :
           item.type === 'task' ? '•' :
           item.type === 'event' ? '○' : '—'}
        </Text>
      </View>
      <View style={styles.entryContent}>
        <Text style={[
          styles.entryText,
          item.status === 'complete' && styles.completedText
        ]}>
          {item.content}
        </Text>
        {(item.tags.length > 0 || item.contexts.length > 0) && (
          <View style={styles.tagContainer}>
            {item.contexts.map(ctx => (
              <Text key={ctx} style={styles.contextTag}>@{ctx}</Text>
            ))}
            {item.tags.map(tag => (
              <Text key={tag} style={styles.hashTag}>#{tag}</Text>
            ))}
          </View>
        )}
        <Text style={styles.dateText}>
          {new Date(item.collectionDate).toLocaleDateString()}
        </Text>
      </View>
      {showRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeEntryFromCollection(item.id)}
        >
          <Ionicons name="close-circle" size={20} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAssignmentEntryItem = ({ item }: { item: EntryWithSelection }) => (
    <TouchableOpacity
      style={[
        styles.assignmentEntryContainer,
        item.isSelected && styles.selectedEntryContainer
      ]}
      onPress={() => toggleEntrySelection(item.id)}
    >
      <View style={styles.checkboxContainer}>
        <View style={[
          styles.checkbox,
          item.isSelected && styles.checkedBox
        ]}>
          {item.isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>
      <View style={styles.entryContent}>
        <Text style={[
          styles.entryText,
          item.status === 'complete' && styles.completedText
        ]}>
          {item.content}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.collectionDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAssignModal = () => (
    <Modal
      visible={showAssignModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAssignModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAssignModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Assign Entries</Text>
          <TouchableOpacity onPress={handleAssignEntries}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalSubheader}>
          <Text style={styles.modalSubtitle}>
            Select entries to add to "{collection.type === 'custom' ? collection.name : collection.type}"
          </Text>
          <Text style={styles.selectionCount}>
            {entriesWithSelection.filter(e => e.isSelected).length} selected
          </Text>
        </View>
        
        <FlatList
          data={entriesWithSelection}
          keyExtractor={(item) => item.id}
          renderItem={renderAssignmentEntryItem}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );

  const getCollectionTitle = () => {
    if (collection.type === 'custom') {
      return collection.name || 'Custom Collection';
    }
    return collection.type === 'daily' ? 'Daily Log' :
           collection.type === 'monthly' ? 'Monthly Log' :
           collection.type === 'future' ? 'Future Log' :
           collection.type;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getCollectionTitle()}</Text>
        <TouchableOpacity onPress={() => setShowAssignModal(true)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Collection Info */}
      <View style={styles.collectionInfo}>
        <Text style={styles.collectionDate}>
          {collection.type === 'daily' 
            ? new Date(collection.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : collection.date
          }
        </Text>
        <Text style={styles.entryCount}>
          {collectionEntries.length} entries
        </Text>
      </View>

      {/* Entries List */}
      {collectionEntries.length > 0 ? (
        <FlatList
          data={collectionEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderEntryItem({ item, showRemove: true })}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Entries</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to add entries to this collection
          </Text>
        </View>
      )}

      {renderAssignModal()}
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
  collectionInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    alignItems: 'center',
  },
  collectionDate: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  entryCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  bulletContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
  },
  bullet: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  entryContent: {
    flex: 1,
    marginLeft: 12,
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  contextTag: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
    marginBottom: 4,
  },
  hashTag: {
    fontSize: 14,
    color: '#FF9500',
    marginRight: 8,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
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
  modalSubheader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    padding: 20,
  },
  assignmentEntryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEntryContainer: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
});