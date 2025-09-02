import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card, PaperButton } from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface SimpleSignInScreenProps {
  onSignIn: () => void;
}

export const SimpleSignInScreen: React.FC<SimpleSignInScreenProps> = ({ onSignIn }) => {
  const { theme } = useTheme();
  
  return (
    <PaperBackground>
      <SafeAreaView style={[styles.container, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.background, '#FAF7F0')
      }]}>
      <View style={styles.content}>
        {/* Header */}
        <Card style={[styles.header, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
          <Typography variant="largeTitle" style={[styles.title, {
            color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
          }]}>Bullet Journal</Typography>
          <Typography variant="body" style={[styles.subtitle, {
            color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
          }]}>
            Bridge your analog journal with digital productivity
          </Typography>
        </Card>

        {/* Bullet Journal Visual */}
        <Card style={[styles.visualContainer, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
          <View style={styles.paperPage}>
            <View style={styles.sampleEntries}>
              <View style={styles.entryRow}>
                <Typography variant="body" style={styles.bullet}>•</Typography>
                <Typography variant="body" style={[styles.entryText, {
                  color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
                }]}>Complete project proposal</Typography>
              </View>
              <View style={styles.entryRow}>
                <Typography variant="body" style={styles.bullet}>○</Typography>
                <Typography variant="body" style={[styles.entryText, {
                  color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
                }]}>Team meeting 2:00 PM</Typography>
              </View>
              <View style={styles.entryRow}>
                <Typography variant="body" style={styles.bullet}>—</Typography>
                <Typography variant="body" style={[styles.entryText, {
                  color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
                }]}>Great ideas from the session</Typography>
              </View>
            </View>
          </View>
        </Card>

        {/* Demo Sign In Button */}
        <View style={styles.authButtons}>
          <PaperButton
            variant="primary"
            size="lg"
            onPress={onSignIn}
            style={styles.demoButton}
          >
            <Ionicons name="play-outline" size={20} color="white" />
            <Typography variant="body" style={styles.demoButtonText}>Try Demo</Typography>
          </PaperButton>
        </View>

        {/* Privacy Notice */}
        <Typography variant="caption" style={[styles.privacyText, {
          color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
        }]}>
          Demo mode - Your data stays on your device and won't be saved permanently.
        </Typography>
      </View>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  visualContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  paperPage: {
    width: 280,
    height: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sampleEntries: {
    marginTop: 40,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bullet: {
    fontSize: 16,
    color: '#1C1C1E',
    marginRight: 12,
    width: 16,
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  authButtons: {
    marginBottom: 40,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
});