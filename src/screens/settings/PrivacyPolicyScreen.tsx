import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { 
  Typography, 
  PaperBackground, 
  Card, 
  PaperButton,
  PAPER_DESIGN_TOKENS 
} from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface PrivacyPolicyScreenProps {
  navigation: any;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Set the bullet journal privacy policy content directly
      const bulletJournalPrivacy = `BULLET JOURNAL APP PRIVACY POLICY
      
This privacy policy applies to the Bullet Journal App and describes how we handle your personal information.

DATA COLLECTION & USAGE

• Journal Entries: All your bullet journal entries are stored locally on your device. We do not have access to your personal journal content.

• Image Processing: When you scan journal pages:
  - Images are processed locally when possible
  - For enhanced OCR, images may be temporarily sent to AI services (OpenAI, Mistral)
  - Images are not stored on our servers
  - Processing is done securely over encrypted connections

• Apple Integration: If you enable Apple Reminders/Calendar sync:
  - Data syncs directly with your iCloud account
  - We do not store your Apple ID or credentials
  - Synced data remains within Apple's ecosystem

• Analytics: We collect anonymous usage statistics to improve the app:
  - Feature usage patterns
  - App performance metrics
  - Crash reports
  - No personal content is included

YOUR PRIVACY RIGHTS

• You can delete all app data at any time through Settings
• You can disable cloud OCR and use local processing only
• You can turn off Apple integration at any time
• You can export your data in standard formats

DATA SECURITY

• All network communications use encryption
• Local data is protected by your device security
• We follow industry best practices for data protection

THIRD-PARTY SERVICES

We use the following services that may process your data:
• OpenAI (GPT-4 Vision) - for OCR processing
• Mistral AI - for OCR processing  
• RevenueCat - for subscription management
• Apple iCloud - for Reminders/Calendar sync

CONTACT INFORMATION

If you have questions about this privacy policy, please contact us through the app's support feature.

CHANGES TO THIS POLICY

We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy in the app.

EFFECTIVE DATE

This privacy policy is effective as of the date you first use the app.`;
      
      setContent(bulletJournalPrivacy);
    } catch (err) {
      console.error('Failed to load privacy policy:', err);
      setError('Failed to load privacy policy.');
      
      // Fallback content
      setContent(`BULLET JOURNAL APP PRIVACY POLICY

We take your privacy seriously. This app is designed with privacy-first principles:

• Your journal entries stay on your device
• OCR processing can be done locally  
• No personal data is collected without consent
• You have full control over your data`);
    } finally {
      setLoading(false);
    }
  };

  // Remove browser opening since we're not using external URL

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Card variant="elevated" padding="md" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
            />
          </TouchableOpacity>
          <Typography variant="headline" color="text">Privacy Policy</Typography>
          <View style={{ width: 20 }} />
        </Card>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            <Typography variant="body" color="textSecondary" style={styles.loadingText}>
              Loading privacy policy...
            </Typography>
          </View>
        ) : error ? (
          <Card variant="elevated" padding="xl" style={styles.errorCard}>
            <Ionicons 
              name="alert-circle-outline" 
              size={48} 
              color={safeThemeAccess(theme, t => t.colors.error, '#B91C1C')} 
            />
            <Typography variant="body" color="text" style={styles.errorText}>
              {error}
            </Typography>
            <PaperButton 
              variant="ink" 
              size="md" 
              title="Retry" 
              onPress={fetchPrivacyPolicy}
              style={styles.retryButton}
            />
          </Card>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Card variant="elevated" padding="lg" style={styles.contentCard}>
              <Typography variant="body" color="text" style={styles.policyText}>
                {content}
              </Typography>
            </Card>
            
            <Card variant="flat" padding="md" style={styles.footer}>
              <Typography variant="caption" color="textSecondary" style={styles.footerText}>
                Last updated: {new Date().toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="textSecondary" style={styles.footerText}>
                If you have questions about our privacy policy, please contact support.
              </Typography>
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.md,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  contentCard: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  policyText: {
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl4,
  },
  loadingText: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  errorCard: {
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.xl4,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  retryButton: {
    minWidth: 120,
  },
  footer: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl2,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
});