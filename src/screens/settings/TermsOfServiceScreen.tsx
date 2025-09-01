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

interface TermsOfServiceScreenProps {
  navigation: any;
}

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTermsOfService();
  }, []);

  const fetchTermsOfService = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Set the bullet journal terms of service content directly
      const bulletJournalTerms = `BULLET JOURNAL APP TERMS OF SERVICE
      
By using the Bullet Journal App, you agree to these terms of service.

ACCEPTANCE OF TERMS

By downloading, installing, or using this app, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.

USE OF THE APP

• Personal Use: This app is for personal bullet journaling and productivity purposes
• License: We grant you a personal, non-transferable license to use the app
• Restrictions: You may not reverse engineer, modify, or redistribute the app
• Content: You retain ownership of all journal entries and content you create

BULLET JOURNAL METHOD

• This app implements the Bullet Journal® method created by Ryder Carroll
• Bullet Journal® is a registered trademark of Ryder Carroll
• This app is not officially affiliated with or endorsed by Ryder Carroll
• We respect and follow the official Bullet Journal notation system

SUBSCRIPTION & PAYMENTS

• Free Tier: Basic features are available at no cost
• Pro Features: Advanced features require a subscription
• Billing: Subscriptions are billed through the App Store
• Refunds: Subject to App Store policies

YOUR CONTENT

• Ownership: You own all content you create in the app
• Backup: You are responsible for backing up your journal data
• Export: You can export your data at any time
• No Claim: We make no claim to ownership of your journal entries

OCR & AI SERVICES

• Optional Service: OCR processing is optional and can be disabled
• Processing: Images may be sent to third-party AI services for processing
• Accuracy: OCR results may not be 100% accurate
• Review: Always review and correct OCR results

APPLE INTEGRATION

• Optional Feature: Apple Reminders and Calendar sync is optional
• iCloud: Synced data is stored in your iCloud account
• Apple Terms: Subject to Apple's terms of service

LIMITATIONS OF LIABILITY

• No Warranty: The app is provided "as is" without warranty
• Data Loss: We are not responsible for data loss
• Accuracy: OCR and parsing may have errors
• Availability: We do not guarantee uninterrupted service

PRIVACY

Your privacy is important to us. Please review our Privacy Policy for information on how we handle your data.

CHANGES TO TERMS

We may update these terms from time to time. Continued use of the app constitutes acceptance of updated terms.

TERMINATION

• You may stop using the app at any time
• We may terminate or suspend access for violations of these terms
• Your data remains yours after termination

GOVERNING LAW

These terms are governed by the laws of the jurisdiction where the app is developed.

CONTACT

For questions about these terms, please contact support through the app.

EFFECTIVE DATE

These terms are effective as of the date you first use the app.`;
      
      setContent(bulletJournalTerms);
    } catch (err) {
      console.error('Failed to load terms of service:', err);
      setError('Failed to load terms of service.');
      
      // Fallback content
      setContent(`BULLET JOURNAL APP TERMS OF SERVICE

By using this app, you agree to these terms:

• The app is for personal use only
• You own your journal content
• We provide the app "as is"
• Subscriptions are handled through the App Store
• You can export your data at any time`);
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
          <Typography variant="headline" color="text">Terms of Service</Typography>
          <View style={{ width: 20 }} />
        </Card>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            <Typography variant="body" color="textSecondary" style={styles.loadingText}>
              Loading terms of service...
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
              onPress={fetchTermsOfService}
              style={styles.retryButton}
            />
          </Card>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Card variant="elevated" padding="lg" style={styles.contentCard}>
              <Typography variant="body" color="text" style={styles.termsText}>
                {content}
              </Typography>
            </Card>
            
            <Card variant="flat" padding="md" style={styles.footer}>
              <Typography variant="caption" color="textSecondary" style={styles.footerText}>
                Last updated: {new Date().toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="textSecondary" style={styles.footerText}>
                By using this app, you agree to these terms.
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
  termsText: {
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