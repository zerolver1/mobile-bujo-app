import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useBuJoStore } from '../../stores/BuJoStore';
import { useSubscriptionStore } from '../../stores/SubscriptionStore';
import { smartOCRService } from '../../services/ocr/SmartOCRService';
import { enhancedBuJoParser } from '../../services/parser/EnhancedBuJoParser';
import { OCREntryMapper } from '../../services/utils/OCREntryMapper';
import { useProcessingStore } from '../../stores/ProcessingStore';
import { ImageMetadataService, ImageMetadata } from '../../services/utils/ImageMetadataService';
import { useTheme } from '../../theme';
import { PaperBackground } from '../../components/ui/PaperBackground';
import { PaperButton } from '../../components/ui/PaperButton';
import { Typography } from '../../components/ui/Typography';
import { NotebookCard } from '../../components/ui/NotebookCard';
import { safeThemeAccess } from '../../theme/paperStyleUtils';
import { PAPER_DESIGN_TOKENS } from '../../theme/paperDesignTokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CaptureScreenProps {
  navigation?: any;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [selectedPageType, setSelectedPageType] = useState<'daily' | 'monthly' | 'collection' | 'auto'>('auto');
  const [showTips, setShowTips] = useState(false); // Start collapsed
  const cameraRef = useRef<CameraView>(null);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { addScan } = useBuJoStore();
  const { canPerformScan, trackScan, triggerPaywall } = useSubscriptionStore();
  const { startTask, updateTask, completeTask, failTask, speedPreference } = useProcessingStore();

  // Initialize Smart OCR service on component mount
  useEffect(() => {
    const initializeOCRServices = async () => {
      try {
        await smartOCRService.initialize();
        console.log('Smart OCR service initialized with all providers');
      } catch (error) {
        console.error('Failed to initialize Smart OCR service:', error);
      }
    };

    initializeOCRServices();
    
    // Cleanup on unmount
    return () => {
      smartOCRService.cleanup().catch(error => {
        console.error('Failed to cleanup Smart OCR service:', error);
      });
    };
  }, []);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    // Check scan limits
    if (!canPerformScan()) {
      triggerPaywall({
        trigger: 'scan_limit_reached',
        remainingScans: 0,
      });
      return;
    }

    try {
      setProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Track the scan
      trackScan();

      // Process the image (placeholder - will integrate OCR later)
      await processImage(photo.uri);

    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setProcessing(false);
    }
  };

  const handlePickImage = async () => {
    // Check scan limits
    if (!canPerformScan()) {
      triggerPaywall({
        trigger: 'scan_limit_reached',
        remainingScans: 0,
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProcessing(true);
        trackScan();
        await processImage(result.assets[0].uri);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Image picker failed:', error);
      Alert.alert('Error', 'Failed to pick image');
      setProcessing(false);
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      console.log('Starting intelligent OCR processing...');
      console.log('Selected page type:', selectedPageType);
      
      // Start global processing task
      const taskId = startTask({
        type: 'ocr',
        stage: `Analyzing ${selectedPageType === 'auto' ? 'page' : selectedPageType + ' page'}...`,
        progress: 10,
        canNavigate: false,
        imageUri: imageUri
      });
      
      // Brief delay to show initial stage
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateTask(taskId, {
        stage: 'Extracting image metadata...',
        progress: 15,
        canNavigate: true
      });

      // Extract image metadata including timestamps and add page type context
      const imageMetadata = await ImageMetadataService.extractMetadata(imageUri);
      console.log('CaptureScreen: Extracted image metadata with page type:', {
        createdAt: imageMetadata.createdAt,
        source: imageMetadata.source,
        estimatedJournalDate: imageMetadata.estimatedJournalDate,
        pageType: selectedPageType
      });
      
      updateTask(taskId, {
        stage: `Processing ${selectedPageType} page with Smart OCR...`,
        progress: 25,
        canNavigate: true
      });
      
      // Step 1: Use Smart OCR Service with user speed preference, metadata, and page type
      console.log(`CaptureScreen: Using speed preference: ${speedPreference}, page type: ${selectedPageType}`);
      
      const ocrResult = await smartOCRService.processImage(imageUri, {
        prioritizeAccuracy: speedPreference === 'accuracy',
        prioritizeSpeed: speedPreference === 'speed',
        maxCostTier: 'premium', // Allow all services
        userSpeedPreference: speedPreference, // Pass user preference
        imageMetadata: {
          ...imageMetadata,
          pageType: selectedPageType // Add page type to metadata for better OCR context
        },
        pageType: selectedPageType // Direct page type hint for OCR service
      });
      
      // Update task with detected service name
      const serviceName = ocrResult.parsedEntries && ocrResult.parsedEntries.length > 0 ? 'gpt-vision' : 'mistral';
      updateTask(taskId, {
        serviceName: serviceName
      });
      
      updateTask(taskId, {
        stage: 'Extracting bullet journal entries...',
        progress: 75
      });
      
      let entries: any[] = [];
      
      // Step 2: Extract and normalize entries consistently
      let rawEntries: any[] = [];
      let ocrSource: 'gpt-vision' | 'mistral' | 'parser' = 'parser';
      
      if (ocrResult.parsedEntries && ocrResult.parsedEntries.length > 0) {
        console.log('Using structured entries from smart OCR:', ocrResult.parsedEntries.length);
        rawEntries = ocrResult.parsedEntries;
        ocrSource = 'gpt-vision'; // Most likely from GPT Vision
        
        // Add page_date from metadata to each entry if available
        if (ocrResult.metadata?.page_date) {
          console.log('CaptureScreen: Adding page_date from OCR metadata:', ocrResult.metadata.page_date);
          rawEntries = rawEntries.map(entry => ({
            ...entry,
            pageDate: entry.pageDate || ocrResult.metadata.page_date
          }));
        }
      } else {
        // Fallback to enhanced parsing for services that return text only
        console.log('Parsing OCR text with enhanced BuJo parser...');
        rawEntries = enhancedBuJoParser.parse(ocrResult.text);
        ocrSource = 'parser';
      }
      
      // Normalize all entries to consistent format with metadata
      entries = OCREntryMapper.mapToConsistentFormat(rawEntries, ocrSource, ocrResult.confidence, imageMetadata);
      
      // Fix common OCR content issues
      entries = entries.map(entry => ({
        ...entry,
        content: OCREntryMapper.fixCommonOCRIssues(entry.content)
      }));
      
      // Validate entries and filter out invalid ones
      entries = entries.filter(entry => OCREntryMapper.validateEntry(entry));
      
      console.log('Smart OCR completed. Text preview:', ocrResult.text.substring(0, 100) + '...');
      console.log('Extracted entries:', entries.length);
      console.log('Average confidence:', (ocrResult.confidence * 100).toFixed(1) + '%');
      
      updateTask(taskId, {
        stage: 'Finalizing results...',
        progress: 90
      });
      
      // Step 3: Add scan record
      const scanHash = await generateImageHash(imageUri);
      addScan({
        imageUri,
        hash: scanHash,
        ocrText: ocrResult.text,
        confidence: ocrResult.confidence,
        extractedEntries: entries.map(e => e.id),
      });
      
      // Step 4: Add entries to BuJo store with page type context
      const { addEntry } = useBuJoStore.getState();
      
      // Determine collection type based on page type selection
      const getCollectionType = (entryCollection?: string) => {
        switch (selectedPageType) {
          case 'daily': return 'daily';
          case 'monthly': return 'monthly';
          case 'collection': return 'custom';
          default: return entryCollection || 'daily';
        }
      };
      
      for (const entry of entries) {
        addEntry({
          type: entry.type,
          content: entry.content,
          status: entry.status,
          priority: entry.priority,
          collection: selectedPageType === 'auto' ? (entry.collection || 'daily') : getCollectionType(entry.collection),
          collectionDate: entry.collectionDate,
          tags: entry.tags,
          contexts: entry.contexts,
          sourceImage: imageUri,
          ocrConfidence: ocrResult.confidence
        });
      }
      
      updateTask(taskId, {
        stage: 'Complete!',
        progress: 100
      });
      
      // Brief delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Serialize all entries for navigation (fix serialization warning)
      const serializedEntries = entries.map(entry => ({
        ...entry,
        createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
        dueDate: entry.dueDate instanceof Date ? entry.dueDate.toISOString() : entry.dueDate,
      }));

      // Also serialize ocrResult.parsedEntries if they exist
      const serializedOcrResult = {
        ...ocrResult,
        parsedEntries: ocrResult.parsedEntries ? ocrResult.parsedEntries.map(entry => ({
          ...entry,
          createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
          dueDate: entry.dueDate instanceof Date ? entry.dueDate.toISOString() : entry.dueDate,
        })) : []
      };

      // Complete the task
      completeTask(taskId);

      // Navigate to review screen
      if (navigation) {
        navigation.navigate('EntryReview', {
          imageUri,
          ocrResult: serializedOcrResult,
          parsedEntries: serializedEntries
        });
      } else {
        // Fallback alert if navigation not available  
        Alert.alert(
          'Page Processed!',
          `Found ${entries.length} bullet journal entries.\n\nProcessed with Smart OCR\nConfidence: ${Math.round(ocrResult.confidence * 100)}%`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Image processing failed:', error);
      
      // Find the task ID if it exists (in case of error during processing)
      const taskId = startTask({
        type: 'ocr',
        stage: 'Processing failed',
        progress: 0,
        canNavigate: true,
        imageUri: imageUri,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      failTask(taskId, error instanceof Error ? error.message : 'Unknown error');
      
      Alert.alert(
        'Processing Failed', 
        'Could not process the image. Please try again with better lighting or a clearer photo.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Generate a simple hash for the image
  const generateImageHash = async (imageUri: string): Promise<string> => {
    // Simple hash based on timestamp and URI
    const timestamp = Date.now();
    const uriHash = imageUri.split('/').pop() || 'unknown';
    return `${timestamp}-${uriHash}`;
  };

  if (!permission) {
    return (
      <PaperBackground variant="subtle" intensity="light">
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
          <Typography variant="body" color="textSecondary" style={styles.permissionText}>
            Requesting camera permission...
          </Typography>
        </View>
      </PaperBackground>
    );
  }

  if (!permission.granted) {
    return (
      <PaperBackground variant="lined" showMargin={true} intensity="light">
        <View style={styles.permissionContainer}>
          <NotebookCard variant="page" showHoles={false} style={styles.permissionCard}>
            <Ionicons name="camera-outline" size={64} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            <Typography variant="h2" color="text" style={styles.permissionTitle}>
              Camera Access Required
            </Typography>
            <Typography variant="body" color="textSecondary" style={styles.permissionText}>
              We need camera access to scan your beautiful bullet journal pages.
            </Typography>
            <PaperButton 
              variant="ink"
              size="md"
              title="Grant Permission"
              onPress={requestPermission}
            />
          </NotebookCard>
        </View>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground variant="subtle" intensity="minimal">
      <SafeAreaView style={styles.container}>
        {/* Page Type Selector */}
        <View style={styles.pageTypeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pageTypeScroller}>
            {[
              { type: 'auto', label: 'Auto Detect', icon: 'sparkles' },
              { type: 'daily', label: 'Daily Log', icon: 'today' },
              { type: 'monthly', label: 'Monthly', icon: 'calendar' },
              { type: 'collection', label: 'Collection', icon: 'list' },
            ].map((item) => (
              <TouchableOpacity
                key={item.type}
                style={[
                  styles.pageTypeButton,
                  selectedPageType === item.type && styles.pageTypeButtonActive
                ]}
                onPress={() => setSelectedPageType(item.type as any)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={16} 
                  color={selectedPageType === item.type ? '#FFFFFF' : safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
                />
                <Typography 
                  variant="caption1" 
                  style={[
                    styles.pageTypeLabel,
                    { color: selectedPageType === item.type ? '#FFFFFF' : safeThemeAccess(theme, t => t.colors.text, '#2B2B2B') }
                  ]}
                >
                  {item.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Camera View with Paper Frame - Dynamic size based on tips visibility */}
        <View style={[styles.cameraContainer, !showTips && styles.cameraContainerExpanded]}>
          <View style={styles.paperFrame}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            />
            
            {/* Paper-style overlay guides */}
            <View style={styles.overlay}>
              {/* Paper texture frame */}
              <View style={styles.viewfinderFrame}>
                {/* Washi tape corner guides */}
                <View style={[styles.washiTape, styles.topLeft]} />
                <View style={[styles.washiTape, styles.topRight]} />
                <View style={[styles.washiTape, styles.bottomLeft]} />
                <View style={[styles.washiTape, styles.bottomRight]} />
                
                {/* Page alignment guides based on type */}
                {selectedPageType === 'daily' && (
                  <View style={styles.dailyGuides}>
                    <View style={styles.marginLine} />
                    <View style={styles.bulletColumn} />
                  </View>
                )}
                
                {selectedPageType === 'monthly' && (
                  <View style={styles.monthlyGrid}>
                    {[...Array(7)].map((_, i) => (
                      <View key={i} style={styles.gridLine} />
                    ))}
                  </View>
                )}
              </View>
              
              {/* Scanning instruction */}
              <View style={styles.instructionContainer}>
                <NotebookCard variant="sticky" style={styles.instructionCard}>
                  <Typography variant="caption1" color="text">
                    {selectedPageType === 'daily' ? 'Align daily log with margin guide' :
                     selectedPageType === 'monthly' ? 'Position monthly spread in frame' :
                     selectedPageType === 'collection' ? 'Center your collection page' :
                     'Position your journal page'}
                  </Typography>
                </NotebookCard>
              </View>
            </View>
          </View>
        </View>

        {/* Paper-style Controls */}
        <View style={styles.controlsContainer}>
          <NotebookCard variant="page" showHoles={false} style={styles.controlsCard}>
            <View style={styles.controls}>
              <PaperButton
                variant="pencil"
                size="sm"
                title="Library"
                icon="images-outline"
                onPress={handlePickImage}
                disabled={processing}
                style={styles.libraryButton}
              />

              <TouchableOpacity 
                style={[styles.captureButton, processing && styles.captureButtonDisabled]}
                onPress={handleTakePhoto}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="large" color={safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')} />
                ) : (
                  <View style={styles.inkStamp}>
                    <Ionicons name="scan" size={32} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              <PaperButton
                variant="pencil"
                size="sm"
                title="Tips"
                icon={showTips ? "eye-off-outline" : "eye-outline"}
                onPress={() => setShowTips(!showTips)}
                style={styles.tipsButton}
              />
            </View>
          </NotebookCard>
        </View>

        {/* Collapsible BuJo-specific Tips */}
        <View style={[styles.tipsWrapper, { paddingBottom: insets.bottom + 80 }]}>
          {showTips ? (
            <NotebookCard variant="sticky" style={styles.tipsContainer}>
              <TouchableOpacity 
                style={styles.tipsHeader} 
                onPress={() => setShowTips(false)}
                activeOpacity={0.7}
              >
                <Typography variant="subtitle2" color="text" style={styles.tipsTitle}>
                  {selectedPageType === 'daily' ? '📓 Daily Log Tips' :
                   selectedPageType === 'monthly' ? '📅 Monthly Spread Tips' :
                   selectedPageType === 'collection' ? '📚 Collection Tips' :
                   '✨ Smart Scanning Tips'}
                </Typography>
                <Ionicons name="chevron-down" size={20} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
              </TouchableOpacity>
            
            {selectedPageType === 'daily' && (
              <>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Include signifiers (•, ×, >, etc.) in frame
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Capture full width for context & tags
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Date header helps with organization
                </Typography>
              </>
            )}
            
            {selectedPageType === 'monthly' && (
              <>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Scan full spread if possible
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Include month title for context
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Grid lines help with alignment
                </Typography>
              </>
            )}
            
            {selectedPageType === 'collection' && (
              <>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Include collection title
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Numbered lists scan better
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Group related items visually
                </Typography>
              </>
            )}
            
            {selectedPageType === 'auto' && (
              <>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Good lighting reduces shadows
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Dark ink (black/blue) scans best
                </Typography>
                <Typography variant="caption1" color="textSecondary" style={styles.tipItem}>
                  • Hold steady for sharp capture
                </Typography>
              </>
            )}
            </NotebookCard>
          ) : (
            <TouchableOpacity 
              style={styles.tipsToggle} 
              onPress={() => setShowTips(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="bulb-outline" size={18} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
              <Typography variant="caption1" color="text" style={styles.tipsToggleText}>
                Show Tips
              </Typography>
              <Ionicons name="chevron-up" size={16} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl4,
  },
  permissionCard: {
    alignItems: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.xl4,
    maxWidth: 320,
  },
  permissionTitle: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.xl,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl2,
  },
  
  // Page Type Selector
  pageTypeContainer: {
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 42, 68, 0.1)',
  },
  pageTypeScroller: {
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  pageTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.md,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
    marginRight: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 42, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(15, 42, 68, 0.1)',
  },
  pageTypeButtonActive: {
    backgroundColor: '#0F2A44',
    borderColor: '#0F2A44',
  },
  pageTypeLabel: {
    marginLeft: PAPER_DESIGN_TOKENS.spacing.xs,
    fontWeight: '500',
  },
  
  // Camera View
  cameraContainer: {
    flex: 1,
    padding: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  cameraContainerExpanded: {
    flex: 1.3, // Take more space when tips are hidden
  },
  paperFrame: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    // Paper-like shadow
    shadowColor: 'rgba(139, 69, 19, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewfinderFrame: {
    flex: 1,
    margin: 20,
  },
  
  // Washi Tape Corner Guides
  washiTape: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 223, 186, 0.7)', // Warm washi tape color
    borderWidth: 1,
    borderColor: 'rgba(210, 180, 140, 0.5)',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomRightRadius: 8,
    transform: [{ rotate: '-2deg' }],
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomLeftRadius: 8,
    transform: [{ rotate: '2deg' }],
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopRightRadius: 8,
    transform: [{ rotate: '1deg' }],
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 8,
    transform: [{ rotate: '-1deg' }],
  },
  
  // Page-specific guides
  dailyGuides: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  marginLine: {
    position: 'absolute',
    left: 60,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(220, 38, 127, 0.3)', // Pink margin line
  },
  bulletColumn: {
    position: 'absolute',
    left: 20,
    top: '30%',
    bottom: '30%',
    width: 30,
    backgroundColor: 'rgba(15, 42, 68, 0.05)',
    borderRadius: 4,
  },
  monthlyGrid: {
    position: 'absolute',
    top: '20%',
    bottom: '20%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  gridLine: {
    width: 1,
    backgroundColor: 'rgba(15, 42, 68, 0.1)',
  },
  
  // Instructions
  instructionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionCard: {
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.md,
    backgroundColor: 'rgba(255, 250, 230, 0.95)',
    transform: [{ rotate: '-0.5deg' }],
  },
  
  // Controls
  controlsContainer: {
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  controlsCard: {
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.xl,
    backgroundColor: 'rgba(245, 242, 232, 0.98)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl2,
  },
  libraryButton: {
    minWidth: 80,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F2A44',
    justifyContent: 'center',
    alignItems: 'center',
    // Ink stamp shadow
    shadowColor: 'rgba(15, 42, 68, 0.6)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  inkStamp: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0F2A44',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipsButton: {
    minWidth: 80,
  },
  
  // Tips
  tipsWrapper: {
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  tipsContainer: {
    padding: PAPER_DESIGN_TOKENS.spacing.xl,
    backgroundColor: 'rgba(255, 250, 230, 0.95)',
    transform: [{ rotate: '0.5deg' }],
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  tipsTitle: {
    fontWeight: '600',
    flex: 1,
  },
  tipItem: {
    lineHeight: 20,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  tipsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.md,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    backgroundColor: 'rgba(245, 242, 232, 0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 42, 68, 0.1)',
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  tipsToggleText: {
    fontWeight: '500',
  },
});