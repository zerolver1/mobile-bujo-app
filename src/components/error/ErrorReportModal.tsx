import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorReportingService, ErrorReport } from '../../services/error/ErrorReportingService';

interface ErrorReportModalProps {
  visible: boolean;
  onClose: () => void;
  errorType?: ErrorReport['type'];
  initialMessage?: string;
  context?: ErrorReport['context'];
}

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  visible,
  onClose,
  errorType = 'USER_REPORTED',
  initialMessage = '',
  context,
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [userFeedback, setUserFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please describe the issue you encountered.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const errorId = await errorReportingService.reportError(
        errorType,
        message,
        context
      );

      if (userFeedback.trim()) {
        await errorReportingService.addUserFeedback(errorId, userFeedback);
      }

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting this issue. We\'ll use your feedback to improve the app.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'We couldn\'t submit your report right now. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage(initialMessage);
    setUserFeedback('');
    setIsSubmitting(false);
    onClose();
  };

  const getErrorTypeDisplay = (type: ErrorReport['type']) => {
    switch (type) {
      case 'OCR_PARSE_ERROR':
        return 'OCR Recognition Issue';
      case 'NETWORK_ERROR':
        return 'Network Problem';
      case 'APP_CRASH':
        return 'App Crash';
      case 'USER_REPORTED':
        return 'General Issue';
      default:
        return 'Issue Report';
    }
  };

  const getErrorTypeIcon = (type: ErrorReport['type']) => {
    switch (type) {
      case 'OCR_PARSE_ERROR':
        return 'scan-outline';
      case 'NETWORK_ERROR':
        return 'wifi-outline';
      case 'APP_CRASH':
        return 'warning-outline';
      case 'USER_REPORTED':
        return 'help-circle-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
            <Text style={[styles.cancelButton, isSubmitting && styles.disabledText]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Issue</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={[styles.submitButton, isSubmitting && styles.disabledText]}>
              {isSubmitting ? 'Sending...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Error Type Display */}
          <View style={styles.errorTypeSection}>
            <View style={styles.errorTypeHeader}>
              <Ionicons 
                name={getErrorTypeIcon(errorType) as any} 
                size={24} 
                color="#FF3B30" 
              />
              <Text style={styles.errorTypeTitle}>
                {getErrorTypeDisplay(errorType)}
              </Text>
            </View>
            
            {errorType === 'OCR_PARSE_ERROR' && (
              <Text style={styles.errorTypeDescription}>
                Help us improve text recognition by describing what went wrong with the scanning process.
              </Text>
            )}
            
            {errorType === 'NETWORK_ERROR' && (
              <Text style={styles.errorTypeDescription}>
                Let us know about connectivity issues or slow response times you've experienced.
              </Text>
            )}

            {errorType === 'USER_REPORTED' && (
              <Text style={styles.errorTypeDescription}>
                Describe any issue, suggestion, or feedback about the app.
              </Text>
            )}
          </View>

          {/* Issue Description */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>What happened? *</Text>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue you encountered..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          {/* Additional Context */}
          {context && (
            <View style={styles.contextSection}>
              <Text style={styles.formLabel}>Context Information</Text>
              <View style={styles.contextCard}>
                {context.screen && (
                  <View style={styles.contextItem}>
                    <Text style={styles.contextKey}>Screen:</Text>
                    <Text style={styles.contextValue}>{context.screen}</Text>
                  </View>
                )}
                {context.action && (
                  <View style={styles.contextItem}>
                    <Text style={styles.contextKey}>Action:</Text>
                    <Text style={styles.contextValue}>{context.action}</Text>
                  </View>
                )}
                {context.appVersion && (
                  <View style={styles.contextItem}>
                    <Text style={styles.contextKey}>Version:</Text>
                    <Text style={styles.contextValue}>{context.appVersion}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Additional Feedback */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Additional Details (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={userFeedback}
              onChangeText={setUserFeedback}
              placeholder="Any other information that might help us understand the issue..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacySection}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
            <Text style={styles.privacyText}>
              Your report helps improve the app. No personal journal content is included in error reports.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  submitButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorTypeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  errorTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
  },
  errorTypeDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 20,
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
    minHeight: 80,
  },
  contextSection: {
    marginBottom: 20,
  },
  contextCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  contextItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  contextKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    minWidth: 80,
  },
  contextValue: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});