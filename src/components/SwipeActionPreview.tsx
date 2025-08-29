import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../types/BuJo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeActionPreviewProps {
  entry: BuJoEntry;
  visible: boolean;
  onClose: () => void;
  onActionSelect: (action: string) => void;
  anchorPosition?: { x: number; y: number };
}

interface ActionOption {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  action: string;
  category: 'status' | 'planning' | 'organization' | 'destructive';
}

const getActionOptions = (entry: BuJoEntry): ActionOption[] => {
  const options: ActionOption[] = [];

  // Common actions based on entry type and status
  switch (entry.type) {
    case 'task':
      if (entry.status === 'incomplete') {
        options.push(
          {
            id: 'complete',
            label: 'Mark Complete',
            description: 'Mark this task as done',
            icon: 'checkmark-circle',
            color: '#FFFFFF',
            backgroundColor: '#34C759',
            action: 'complete',
            category: 'status',
          },
          {
            id: 'migrate',
            label: 'Migrate Forward',
            description: 'Move to future log or monthly',
            icon: 'arrow-forward-circle',
            color: '#FFFFFF',
            backgroundColor: '#FF9500',
            action: 'migrate',
            category: 'planning',
          },
          {
            id: 'schedule',
            label: 'Schedule for Later',
            description: 'Set a specific date and time',
            icon: 'calendar',
            color: '#FFFFFF',
            backgroundColor: '#007AFF',
            action: 'schedule',
            category: 'planning',
          },
          {
            id: 'cancel',
            label: 'Cancel Task',
            description: 'Mark as irrelevant or cancelled',
            icon: 'close-circle',
            color: '#FFFFFF',
            backgroundColor: '#FF3B30',
            action: 'cancel',
            category: 'status',
          }
        );
      }
      break;

    case 'event':
      options.push(
        {
          id: 'complete',
          label: 'Mark Attended',
          description: 'Mark this event as completed',
          icon: 'checkmark-circle',
          color: '#FFFFFF',
          backgroundColor: '#34C759',
          action: 'complete',
          category: 'status',
        },
        {
          id: 'edit',
          label: 'Edit Details',
          description: 'Change time, location, or notes',
          icon: 'pencil',
          color: '#FFFFFF',
          backgroundColor: '#007AFF',
          action: 'edit',
          category: 'organization',
        }
      );
      break;

    case 'note':
      options.push(
        {
          id: 'convert',
          label: 'Convert to Task',
          description: 'Turn this note into an actionable task',
          icon: 'repeat',
          color: '#FFFFFF',
          backgroundColor: '#5856D6',
          action: 'convert',
          category: 'organization',
        },
        {
          id: 'archive',
          label: 'Archive Note',
          description: 'Move to archived notes collection',
          icon: 'archive',
          color: '#FFFFFF',
          backgroundColor: '#8E8E93',
          action: 'archive',
          category: 'organization',
        }
      );
      break;

    case 'inspiration':
      options.push(
        {
          id: 'convert',
          label: 'Create Task',
          description: 'Turn inspiration into actionable task',
          icon: 'repeat',
          color: '#FFFFFF',
          backgroundColor: '#5856D6',
          action: 'convert',
          category: 'organization',
        },
        {
          id: 'archive',
          label: 'Save Inspiration',
          description: 'Add to inspiration collection',
          icon: 'bookmark',
          color: '#000000',
          backgroundColor: '#FFD60A',
          action: 'archive',
          category: 'organization',
        }
      );
      break;

    case 'research':
      options.push(
        {
          id: 'complete',
          label: 'Research Complete',
          description: 'Mark investigation as finished',
          icon: 'checkmark-circle',
          color: '#FFFFFF',
          backgroundColor: '#34C759',
          action: 'complete',
          category: 'status',
        },
        {
          id: 'convert',
          label: 'Create Task',
          description: 'Convert findings into actionable task',
          icon: 'repeat',
          color: '#FFFFFF',
          backgroundColor: '#5856D6',
          action: 'convert',
          category: 'organization',
        }
      );
      break;

    case 'memory':
      options.push(
        {
          id: 'archive',
          label: 'Save Memory',
          description: 'Add to permanent memory collection',
          icon: 'heart',
          color: '#FFFFFF',
          backgroundColor: '#FF2D55',
          action: 'archive',
          category: 'organization',
        },
        {
          id: 'edit',
          label: 'Add Details',
          description: 'Add photos or more reflection',
          icon: 'pencil',
          color: '#FFFFFF',
          backgroundColor: '#007AFF',
          action: 'edit',
          category: 'organization',
        }
      );
      break;
  }

  // Add common destructive actions
  options.push({
    id: 'delete',
    label: 'Delete Entry',
    description: 'Permanently remove this entry',
    icon: 'trash',
    color: '#FFFFFF',
    backgroundColor: '#FF453A',
    action: 'delete',
    category: 'destructive',
  });

  return options;
};

export const SwipeActionPreview: React.FC<SwipeActionPreviewProps> = ({
  entry,
  visible,
  onClose,
  onActionSelect,
  anchorPosition,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const actionOptions = getActionOptions(entry);
  
  // Group actions by category for better organization
  const groupedActions = {
    status: actionOptions.filter(a => a.category === 'status'),
    planning: actionOptions.filter(a => a.category === 'planning'),
    organization: actionOptions.filter(a => a.category === 'organization'),
    destructive: actionOptions.filter(a => a.category === 'destructive'),
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const renderActionGroup = (title: string, actions: ActionOption[]) => {
    if (actions.length === 0) return null;
    
    return (
      <View style={styles.actionGroup} key={title}>
        <Text style={styles.groupTitle}>{title}</Text>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionOption}
            onPress={() => {
              onActionSelect(action.action);
              onClose();
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.backgroundColor }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.entryPreview}>
              <Text style={styles.entryType}>
                {entry.type === 'task' ? '•' : 
                 entry.type === 'event' ? '○' : 
                 entry.type === 'note' ? '−' :
                 entry.type === 'inspiration' ? '★' :
                 entry.type === 'research' ? '&' :
                 entry.type === 'memory' ? '◇' : '•'}
              </Text>
              <Text style={styles.entryContent} numberOfLines={2}>
                {entry.content}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Action Groups */}
          <View style={styles.actionsContainer}>
            {renderActionGroup('Status Actions', groupedActions.status)}
            {renderActionGroup('Planning Actions', groupedActions.planning)}
            {renderActionGroup('Organization', groupedActions.organization)}
            {renderActionGroup('Destructive Actions', groupedActions.destructive)}
          </View>
          
          {/* Swipe Hint */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              💡 Tip: Swipe entries left or right for quick access to these actions
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxWidth: SCREEN_WIDTH - 40,
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  entryPreview: {
    flex: 1,
    marginRight: 12,
  },
  entryType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  entryContent: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  actionsContainer: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  actionGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  hintContainer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  hintText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});