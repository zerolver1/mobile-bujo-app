import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { smartOCRService } from '../../services/ocr/SmartOCRService';
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card } from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

export const OCRStatsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setRefreshing(true);
      
      const [performanceStats, healthStats] = await Promise.all([
        smartOCRService.getPerformanceStats(),
        smartOCRService.getServiceHealth()
      ]);
      
      setStats(performanceStats);
      setServiceHealth(healthStats);
    } catch (error) {
      console.error('Failed to load OCR stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercent = (ratio: number) => {
    return `${(ratio * 100).toFixed(1)}%`;
  };

  const getHealthIcon = (healthy: boolean) => {
    return healthy ? '✅' : '❌';
  };

  const getHealthColor = (healthy: boolean) => {
    return healthy ? '#34C759' : '#FF3B30';
  };

  const StatCard: React.FC<{ title: string; value: string; subtitle?: string }> = ({ 
    title, value, subtitle 
  }) => (
    <Card style={[styles.statCard, {
      backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
    }]}>
      <Typography variant="caption" style={[styles.statTitle, {
        color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
      }]}>{title}</Typography>
      <Typography variant="title" style={[styles.statValue, {
        color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
      }]}>{value}</Typography>
      {subtitle && <Typography variant="caption" style={[styles.statSubtitle, {
        color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
      }]}>{subtitle}</Typography>}
    </Card>
  );

  const ServiceCard: React.FC<{ 
    name: string; 
    health: any; 
    stats: any; 
  }> = ({ name, health, stats }) => (
    <Card style={[styles.serviceCard, {
      backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
    }]}>
      <View style={styles.serviceHeader}>
        <Typography variant="subtitle" style={[styles.serviceName, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>{name}</Typography>
        <Typography variant="caption" style={[styles.serviceStatus, { color: getHealthColor(health.healthy) }]}>
          {getHealthIcon(health.healthy)} {health.available ? 'Available' : 'Unavailable'}
        </Typography>
      </View>
      
      {stats && (
        <View style={styles.serviceStats}>
          <View style={styles.serviceStatRow}>
            <Typography variant="body" style={[styles.serviceStatLabel, {
              color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
            }]}>Attempts:</Typography>
            <Typography variant="body" style={[styles.serviceStatValue, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>{stats.attempts}</Typography>
          </View>
          <View style={styles.serviceStatRow}>
            <Typography variant="body" style={[styles.serviceStatLabel, {
              color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
            }]}>Success Rate:</Typography>
            <Typography variant="body" style={[styles.serviceStatValue, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>{formatPercent(stats.successRate)}</Typography>
          </View>
          <View style={styles.serviceStatRow}>
            <Typography variant="body" style={[styles.serviceStatLabel, {
              color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
            }]}>Avg Time:</Typography>
            <Typography variant="body" style={[styles.serviceStatValue, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>{formatTime(stats.averageTime)}</Typography>
          </View>
          <View style={styles.serviceStatRow}>
            <Typography variant="body" style={[styles.serviceStatLabel, {
              color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
            }]}>Avg Accuracy:</Typography>
            <Typography variant="body" style={[styles.serviceStatValue, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>{formatPercent(stats.averageAccuracy)}</Typography>
          </View>
        </View>
      )}
      
      {health.lastSuccess && (
        <Typography variant="caption" style={[styles.lastSuccess, {
          color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
        }]}>
          Last success: {new Date(health.lastSuccess).toLocaleString()}
        </Typography>
      )}
    </Card>
  );

  return (
    <PaperBackground>
      <SafeAreaView style={[styles.container, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.background, '#FAF7F0')
      }]}>
      <Card style={[styles.header, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
        borderRadius: 0
      }]}>
        <Typography variant="subtitle" style={[styles.headerTitle, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>OCR Performance</Typography>
        <TouchableOpacity style={styles.refreshButton} onPress={loadStats} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#007AFF" 
            style={refreshing ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </Card>

      <ScrollView style={styles.scrollView}>
        {/* Overall Stats */}
        <Typography variant="title" style={[styles.sectionTitle, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>Overall Performance (24h)</Typography>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Processed"
            value={stats?.totalProcessed?.toString() || '0'}
          />
          <StatCard
            title="Success Rate"
            value={stats ? formatPercent(stats.successRate) : '0%'}
          />
          <StatCard
            title="Avg Time"
            value={stats ? formatTime(stats.averageProcessingTime) : '0ms'}
          />
        </View>

        {/* Service Breakdown */}
        <Typography variant="title" style={[styles.sectionTitle, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>Service Health & Stats</Typography>
        
        {serviceHealth && Object.entries(serviceHealth).map(([serviceName, health]: [string, any]) => {
          const serviceDisplayName = serviceName
            .replace('-', ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          const serviceStats = stats?.serviceBreakdown?.[serviceName];
          
          return (
            <ServiceCard
              key={serviceName}
              name={serviceDisplayName}
              health={health}
              stats={serviceStats}
            />
          );
        })}

        {/* Debug Actions */}
        <Typography variant="title" style={[styles.sectionTitle, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>Debug Actions</Typography>
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => {
            Alert.alert(
              'OCR Debug Info',
              JSON.stringify({ stats, serviceHealth }, null, 2),
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.debugButtonText}>Show Raw Data</Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  refreshButton: {
    padding: 8,
  },
  spinning: {
    // Add rotation animation if needed
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  serviceStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  serviceStats: {
    gap: 8,
  },
  serviceStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceStatLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  serviceStatValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  lastSuccess: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontStyle: 'italic',
  },
  debugButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});