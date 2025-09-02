// Guest Welcome Screen
// Shows when app starts, allows users to try as guest or sign in

import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import { PaperBackground } from '../../components/ui/paperComponents/PaperBackground';
import { Card } from '../../components/ui/Card';
import { Typography } from '../../components/ui/Typography';
import { PaperButton } from '../../components/ui/paperComponents/PaperButton';
import { useTheme } from '../../theme';

interface GuestWelcomeScreenProps {
  onContinueAsGuest: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export const GuestWelcomeScreen: React.FC<GuestWelcomeScreenProps> = ({
  onContinueAsGuest,
  onSignIn,
  onSignUp,
}) => {
  const { theme } = useTheme();

  const getStyles = () => {
    if (!theme?.colors || !theme?.spacing) {
      return {
        container: { flex: 1, padding: 16 },
        card: { marginBottom: 16, padding: 20 },
        buttonContainer: { marginTop: 12 },
        divider: { marginVertical: 16 },
      };
    }

    return {
      container: {
        flex: 1,
        padding: theme.spacing.lg,
      },
      card: {
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.xl,
        alignItems: 'center' as const,
      },
      buttonContainer: {
        marginTop: theme.spacing.md,
        width: '100%',
      },
      divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
        opacity: 0.3,
      },
      guestSection: {
        alignItems: 'center' as const,
        marginTop: theme.spacing.lg,
      },
    };
  };

  const styles = getStyles();

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* Welcome Header */}
          <Card variant="elevated" style={styles.card}>
            <Typography variant="h1" color="text" style={{ textAlign: 'center', marginBottom: 8 }}>
              Welcome to BuJo
            </Typography>
            <Typography variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
              Your personal bullet journal, beautifully crafted
            </Typography>
          </Card>

          {/* Authentication Options */}
          <Card variant="page" style={styles.card}>
            <Typography variant="h3" color="text" style={{ marginBottom: 16, textAlign: 'center' }}>
              Sign In to Sync
            </Typography>
            
            <Typography variant="body" color="textSecondary" style={{ textAlign: 'center', marginBottom: 20 }}>
              Create an account to sync your journal across devices
            </Typography>

            <View style={styles.buttonContainer}>
              <PaperButton 
                variant="ink" 
                size="lg" 
                title="Sign In" 
                onPress={onSignIn}
                style={{ marginBottom: 12 }}
              />
              
              <PaperButton 
                variant="pencil" 
                size="lg" 
                title="Create Account" 
                onPress={onSignUp}
              />
            </View>
          </Card>

          {/* Guest Option */}
          <Card variant="sticky" style={styles.card}>
            <View style={styles.guestSection}>
              <Typography variant="h3" color="text" style={{ marginBottom: 8, textAlign: 'center' }}>
                Try as Guest
              </Typography>
              
              <Typography variant="caption1" color="textSecondary" style={{ textAlign: 'center', marginBottom: 16 }}>
                Start journaling immediately. You can sign up later to sync your data.
              </Typography>

              <PaperButton 
                variant="highlight" 
                size="lg" 
                title="Continue as Guest" 
                onPress={onContinueAsGuest}
              />
            </View>
          </Card>

          {/* Features List */}
          <Card variant="flat" style={{ ...styles.card, alignItems: 'flex-start' }}>
            <Typography variant="h4" color="text" style={{ marginBottom: 12 }}>
              What you get:
            </Typography>
            
            {[
              '• Authentic paper journal feel',
              '• Tasks, events, and notes',
              '• Daily and monthly logs', 
              '• OCR scanning of physical pages',
              '• Cross-device sync (with account)',
              '• iOS native integration',
            ].map((feature, index) => (
              <Typography 
                key={index}
                variant="body" 
                color="textSecondary" 
                style={{ marginBottom: 4 }}
              >
                {feature}
              </Typography>
            ))}
          </Card>

        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};