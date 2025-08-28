import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useBuJoStore } from '../../stores/BuJoStore';
import { useSubscriptionStore } from '../../stores/SubscriptionStore';
// import { mlKitService } from '../../services/ocr/MLKitService';
// import { mockOCRService } from '../../services/ocr/MockOCRService';
// import { tesseractService } from '../../services/ocr/TesseractService';
import { smartOCRService } from '../../services/ocr/SmartOCRService';
import { enhancedBuJoParser } from '../../services/parser/EnhancedBuJoParser';

interface CaptureScreenProps {
  navigation?: any;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { addScan } = useBuJoStore();
  const { canPerformScan, trackScan, triggerPaywall } = useSubscriptionStore();

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
      
      // Step 1: Use Smart OCR Service for intelligent provider selection
      const ocrResult = await smartOCRService.processImage(imageUri, {
        prioritizeAccuracy: true, // Prioritize accuracy for bullet journal recognition
        maxCostTier: 'premium' // Allow all services including GPT Vision
      });
      
      let entries: any[] = [];
      
      // Step 2: Extract entries - GPT Vision may provide structured entries
      if (ocrResult.parsedEntries && ocrResult.parsedEntries.length > 0) {
        console.log('Using structured entries from smart OCR:', ocrResult.parsedEntries.length);
        entries = ocrResult.parsedEntries;
      } else {
        // Fallback to enhanced parsing for services that return text only
        console.log('Parsing OCR text with enhanced BuJo parser...');
        entries = enhancedBuJoParser.parse(ocrResult.text);
      }
      
      console.log('Smart OCR completed. Text preview:', ocrResult.text.substring(0, 100) + '...');
      console.log('Extracted entries:', entries.length);
      console.log('Average confidence:', (ocrResult.confidence * 100).toFixed(1) + '%');
      
      // Step 3: Add scan record
      const scanHash = await generateImageHash(imageUri);
      addScan({
        imageUri,
        hash: scanHash,
        ocrText: ocrResult.text,
        confidence: ocrResult.confidence,
        extractedEntries: entries.map(e => e.id),
      });
      
      // Step 4: Add entries to BuJo store
      const { addEntry } = useBuJoStore.getState();
      for (const entry of entries) {
        addEntry({
          type: entry.type,
          content: entry.content,
          status: entry.status,
          priority: entry.priority,
          collection: entry.collection,
          collectionDate: entry.collectionDate,
          tags: entry.tags,
          contexts: entry.contexts,
          sourceImage: imageUri,
          ocrConfidence: ocrResult.confidence
        });
      }
      
      // Step 5: Navigate to review screen
      if (navigation) {
        navigation.navigate('EntryReview', {
          imageUri,
          ocrResult,
          parsedEntries: entries
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
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#8E8E93" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan your bullet journal pages.
        </Text>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
        
        {/* Overlay guides with absolute positioning */}
        <View style={styles.overlay}>
          <View style={styles.guidesContainer}>
            <View style={[styles.cornerGuide, styles.topLeft]} />
            <View style={[styles.cornerGuide, styles.topRight]} />
            <View style={[styles.cornerGuide, styles.bottomLeft]} />
            <View style={[styles.cornerGuide, styles.bottomRight]} />
          </View>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Position your bullet journal page within the guides
            </Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handlePickImage}
          disabled={processing}
        >
          <Ionicons name="images-outline" size={24} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Library</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.captureButton, processing && styles.captureButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for best results:</Text>
        <Text style={styles.tipItem}>• Ensure good lighting</Text>
        <Text style={styles.tipItem}>• Keep page flat and straight</Text>
        <Text style={styles.tipItem}>• Avoid shadows on the page</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
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
    backgroundColor: 'transparent',
  },
  guidesContainer: {
    flex: 1,
    margin: 40,
  },
  cornerGuide: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
    backgroundColor: '#000000',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E5E5E7',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  placeholder: {
    width: 60,
    height: 60,
  },
  tipsContainer: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tipsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipItem: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
});