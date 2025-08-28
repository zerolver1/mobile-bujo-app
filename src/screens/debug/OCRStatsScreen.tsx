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

export const OCRStatsScreen: React.FC = () => {
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
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ServiceCard: React.FC<{ 
    name: string; 
    health: any; 
    stats: any; 
  }> = ({ name, health, stats }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{name}</Text>
        <Text style={[styles.serviceStatus, { color: getHealthColor(health.healthy) }]}>
          {getHealthIcon(health.healthy)} {health.available ? 'Available' : 'Unavailable'}
        </Text>
      </View>
      
      {stats && (
        <View style={styles.serviceStats}>
          <View style={styles.serviceStatRow}>
            <Text style={styles.serviceStatLabel}>Attempts:</Text>
            <Text style={styles.serviceStatValue}>{stats.attempts}</Text>
          </View>
          <View style={styles.serviceStatRow}>
            <Text style={styles.serviceStatLabel}>Success Rate:</Text>
            <Text style={styles.serviceStatValue}>{formatPercent(stats.successRate)}</Text>
          </View>
          <View style={styles.serviceStatRow}>
            <Text style={styles.serviceStatLabel}>Avg Time:</Text>
            <Text style={styles.serviceStatValue}>{formatTime(stats.averageTime)}</Text>
          </View>
          <View style={styles.serviceStatRow}>
            <Text style={styles.serviceStatLabel}>Avg Accuracy:</Text>
            <Text style={styles.serviceStatValue}>{formatPercent(stats.averageAccuracy)}</Text>
          </View>
        </View>
      )}
      
      {health.lastSuccess && (
        <Text style={styles.lastSuccess}>
          Last success: {new Date(health.lastSuccess).toLocaleString()}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OCR Performance</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadStats} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#007AFF" 
            style={refreshing ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Overall Stats */}
        <Text style={styles.sectionTitle}>Overall Performance (24h)</Text>
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
        <Text style={styles.sectionTitle}>Service Health & Stats</Text>
        
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
        <Text style={styles.sectionTitle}>Debug Actions</Text>
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