import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { BuJoEntry } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { Ionicons } from '@expo/vector-icons';
import { CrossReferenceManager } from './CrossReferenceManager';

interface CrossReferenceIndicatorProps {
  entry: BuJoEntry;
  size?: 'sm' | 'md';
  onLinkPress?: (linkedEntry: BuJoEntry) => void;
}

export const CrossReferenceIndicator: React.FC<CrossReferenceIndicatorProps> = ({
  entry,
  size = 'sm',
  onLinkPress,
}) => {
  const { theme } = useTheme();
  const [showManager, setShowManager] = useState(false);
  const { getLinkedEntries, getCrossReferencesForEntry } = useBuJoStore();
  
  const linkedEntries = getLinkedEntries(entry.id);
  const crossReferences = getCrossReferencesForEntry(entry.id);
  const totalLinks = crossReferences.length;

  const getStyles = useMemo(() => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    const iconSize = size === 'md' ? 18 : 14;
    const containerPadding = size === 'md' ? 8 : 6;

    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
      },
      linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 12,
        paddingHorizontal: containerPadding,
        paddingVertical: containerPadding / 2,
        marginRight: 4,
        marginBottom: 4,
      },
      linkButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      linkIcon: {
        marginRight: 4,
      },
      linkText: {
        fontSize: size === 'md' ? 12 : 10,
        color: theme.colors.primary,
        fontWeight: '500',
      },
      linkTextActive: {
        color: theme.colors.background,
      },
      addLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingHorizontal: containerPadding,
        paddingVertical: containerPadding / 2,
        marginRight: 4,
        marginBottom: 4,
      },
      addLinkText: {
        fontSize: size === 'md' ? 12 : 10,
        color: theme.colors.textSecondary,
        marginLeft: 2,
      },
      quickLinks: {
        marginTop: size === 'md' ? 8 : 4,
      },
      quickLinkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        marginBottom: 2,
      },
      quickLinkDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.primary,
        marginRight: 6,
      },
      quickLinkContent: {
        flex: 1,
        fontSize: size === 'md' ? 12 : 10,
        color: theme.colors.textSecondary,
      },
    });
  }, [theme]);

  const fallbackStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    linkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F2E8', borderWidth: 1, borderColor: '#0F2A44', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3, marginRight: 4, marginBottom: 4 },
    linkButtonActive: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    linkIcon: { marginRight: 4 },
    linkText: { fontSize: 10, color: '#0F2A44', fontWeight: '500' },
    linkTextActive: { color: '#F9F6F0' },
    addLinkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3, marginRight: 4, marginBottom: 4 },
    addLinkText: { fontSize: 10, color: '#666', marginLeft: 2 },
    quickLinks: { marginTop: 4 },
    quickLinkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, marginBottom: 2 },
    quickLinkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0F2A44', marginRight: 6 },
    quickLinkContent: { flex: 1, fontSize: 10, color: '#666' },
  });

  const styles = getStyles;

  const handleLinkPress = (linkedEntry: BuJoEntry) => {
    if (onLinkPress) {
      onLinkPress(linkedEntry);
    }
  };

  if (totalLinks === 0 && size === 'sm') {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.addLinkButton}
          onPress={() => setShowManager(true)}
        >
          <Ionicons 
            name="link-outline" 
            size={12} 
            color={theme?.colors?.textSecondary || '#666'} 
          />
          <Text style={styles.addLinkText}>Link</Text>
        </TouchableOpacity>

        <CrossReferenceManager
          entryId={entry.id}
          visible={showManager}
          onClose={() => setShowManager(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Link Button */}
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => setShowManager(true)}
      >
        <Ionicons 
          name="link" 
          size={size === 'md' ? 16 : 12} 
          color={theme?.colors?.primary || '#0F2A44'}
          style={styles.linkIcon}
        />
        <Text style={styles.linkText}>
          {totalLinks} link{totalLinks !== 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>

      {/* Quick Add Link */}
      <TouchableOpacity 
        style={styles.addLinkButton}
        onPress={() => setShowManager(true)}
      >
        <Ionicons 
          name="add" 
          size={size === 'md' ? 14 : 10} 
          color={theme?.colors?.textSecondary || '#666'} 
        />
      </TouchableOpacity>

      {/* Show linked entries in expanded view */}
      {size === 'md' && linkedEntries.length > 0 && (
        <View style={styles.quickLinks}>
          <Typography variant="caption2" color="textSecondary" style={{ marginBottom: 4 }}>
            Linked entries:
          </Typography>
          {linkedEntries.slice(0, 3).map((linkedEntry) => (
            <TouchableOpacity
              key={linkedEntry.id}
              style={styles.quickLinkItem}
              onPress={() => handleLinkPress(linkedEntry)}
            >
              <View style={styles.quickLinkDot} />
              <Text style={styles.quickLinkContent} numberOfLines={1}>
                {linkedEntry.content}
              </Text>
            </TouchableOpacity>
          ))}
          {linkedEntries.length > 3 && (
            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => setShowManager(true)}
            >
              <View style={styles.quickLinkDot} />
              <Text style={[styles.quickLinkContent, { fontStyle: 'italic' }]}>
                +{linkedEntries.length - 3} more...
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <CrossReferenceManager
        entryId={entry.id}
        visible={showManager}
        onClose={() => setShowManager(false)}
        onReferenceAdded={() => {
          // Could add haptic feedback or animation here
        }}
      />
    </View>
  );
};