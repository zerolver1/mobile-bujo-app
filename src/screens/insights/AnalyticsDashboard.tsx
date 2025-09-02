import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme';
import { PaperBackground } from '../../components/ui/PaperBackground';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalEntries: number;
  completionRate: number;
  entriesByType: Record<string, number>;
  entriesByStatus: Record<string, number>;
  productivityStreak: number;
  mostActiveDay: string;
  topTags: Array<{ name: string; count: number }>;
  topContexts: Array<{ name: string; count: number }>;
  weeklyProgress: Array<{ date: string; entries: number; completed: number }>;
  monthlyTrend: Array<{ month: string; entries: number }>;
  migrationStats: {
    totalMigrated: number;
    averageMigrationTime: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { entries } = useBuJoStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const getStyles = useMemo(() => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      container: {
        flex: 1,
      },
      header: {
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.sm || 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      content: {
        flex: 1,
        paddingVertical: theme.spacing?.sm || 8,
      },
      periodSelector: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing?.md || 16,
        marginBottom: theme.spacing?.md || 16,
      },
      periodChip: {
        paddingHorizontal: theme.spacing?.sm || 12,
        paddingVertical: theme.spacing?.xs || 6,
        marginRight: theme.spacing?.xs || 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
      periodChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      periodChipText: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
        fontWeight: '500',
      },
      periodChipTextActive: {
        color: theme.colors.background,
      },
      statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing?.md || 16,
        marginBottom: theme.spacing?.md || 16,
      },
      statCard: {
        width: (width - 48) / 2, // Account for padding and gap
        marginRight: theme.spacing?.sm || 8,
        marginBottom: theme.spacing?.sm || 8,
      },
      statCardContent: {
        alignItems: 'center',
        paddingVertical: theme.spacing?.md || 16,
      },
      statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
      },
      statLabel: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      statSubtitle: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 12,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginTop: 2,
      },
      chartCard: {
        marginHorizontal: theme.spacing?.md || 16,
        marginBottom: theme.spacing?.md || 16,
      },
      chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing?.sm || 8,
      },
      chartContent: {
        paddingVertical: theme.spacing?.sm || 8,
      },
      progressBar: {
        height: 8,
        backgroundColor: theme.colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginVertical: 4,
      },
      progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
      },
      tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing?.xs || 4,
      },
      tagChip: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingHorizontal: theme.spacing?.xs || 6,
        paddingVertical: 2,
        marginRight: theme.spacing?.xs || 4,
        marginBottom: theme.spacing?.xs || 4,
        flexDirection: 'row',
        alignItems: 'center',
      },
      tagText: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 12,
        color: theme.colors.text,
        fontWeight: '500',
      },
      tagCount: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 12,
        color: theme.colors.textSecondary,
        marginLeft: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 4,
        borderRadius: 6,
      },
      weeklyChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        paddingVertical: theme.spacing?.sm || 8,
      },
      weeklyBar: {
        flex: 1,
        marginHorizontal: 2,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        justifyContent: 'flex-end',
        position: 'relative',
      },
      weeklyBarFilled: {
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
        minHeight: 4,
      },
      weeklyBarCompleted: {
        backgroundColor: theme.colors.success || theme.colors.primary,
        borderRadius: 2,
      },
      weeklyLabel: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 10,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
      },
      insightCard: {
        marginHorizontal: theme.spacing?.md || 16,
        marginBottom: theme.spacing?.md || 16,
        backgroundColor: theme.colors.primaryLight || theme.colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
      },
      insightIcon: {
        marginBottom: theme.spacing?.xs || 4,
      },
    });
  }, [theme]);

  const fallbackStyles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    content: { flex: 1, paddingVertical: 8 },
    periodSelector: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
    periodChip: { paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F2E8' },
    periodChipActive: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    periodChipText: { fontSize: 14, color: '#2B2B2B', fontWeight: '500' },
    periodChipTextActive: { color: '#F9F6F0' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 16 },
    statCard: { width: (width - 48) / 2, marginRight: 8, marginBottom: 8 },
    statCardContent: { alignItems: 'center', paddingVertical: 16 },
    statValue: { fontSize: 32, fontWeight: 'bold', color: '#0F2A44', marginBottom: 4 },
    statLabel: { fontSize: 14, color: '#666', textAlign: 'center' },
    statSubtitle: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 2 },
    chartCard: { marginHorizontal: 16, marginBottom: 16 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    chartContent: { paddingVertical: 8 },
    progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginVertical: 4 },
    progressFill: { height: '100%', backgroundColor: '#0F2A44', borderRadius: 4 },
    tagList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    tagChip: { backgroundColor: '#F5F2E8', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
    tagText: { fontSize: 12, color: '#2B2B2B', fontWeight: '500' },
    tagCount: { fontSize: 12, color: '#666', marginLeft: 4, backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 4, borderRadius: 6 },
    weeklyChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingVertical: 8 },
    weeklyBar: { flex: 1, marginHorizontal: 2, backgroundColor: '#E0E0E0', borderRadius: 2, justifyContent: 'flex-end', position: 'relative' },
    weeklyBarFilled: { backgroundColor: '#0F2A44', borderRadius: 2, minHeight: 4 },
    weeklyBarCompleted: { backgroundColor: '#15803D', borderRadius: 2 },
    weeklyLabel: { fontSize: 10, color: '#666', textAlign: 'center', marginTop: 4 },
    insightCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#F5F2E8', borderLeftWidth: 4, borderLeftColor: '#0F2A44' },
    insightIcon: { marginBottom: 4 },
  });

  const styles = getStyles;

  const analytics = useMemo((): AnalyticsData => {
    if (!entries || entries.length === 0) {
      return {
        totalEntries: 0,
        completionRate: 0,
        entriesByType: {},
        entriesByStatus: {},
        productivityStreak: 0,
        mostActiveDay: 'No data',
        topTags: [],
        topContexts: [],
        weeklyProgress: [],
        monthlyTrend: [],
        migrationStats: { totalMigrated: 0, averageMigrationTime: 0 },
      };
    }

    const now = new Date();
    const filterDate = (() => {
      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return weekAgo;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return monthAgo;
        case 'quarter':
          const quarterAgo = new Date(now);
          quarterAgo.setMonth(now.getMonth() - 3);
          return quarterAgo;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          return yearAgo;
      }
    })();

    const filteredEntries = entries.filter(entry => 
      new Date(entry.createdAt) >= filterDate
    );

    // Basic stats
    const totalEntries = filteredEntries.length;
    const completedTasks = filteredEntries.filter(e => e.type === 'task' && e.status === 'complete').length;
    const totalTasks = filteredEntries.filter(e => e.type === 'task').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Entries by type
    const entriesByType: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
    });

    // Entries by status
    const entriesByStatus: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entriesByStatus[entry.status] = (entriesByStatus[entry.status] || 0) + 1;
    });

    // Productivity streak (consecutive days with entries)
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasEntries = entries.some(entry => 
        entry.collectionDate === dateStr
      );
      
      if (hasEntries) {
        streak++;
      } else {
        break;
      }
    }

    // Most active day
    const dayCount: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      const day = new Date(entry.createdAt).toLocaleDateString('en', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCount).reduce((a, b) => 
      dayCount[a[0]] > dayCount[b[0]] ? a : b, ['No data', 0]
    )[0];

    // Top tags
    const tagCount: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Top contexts
    const contextCount: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entry.contexts.forEach(context => {
        contextCount[context] = (contextCount[context] || 0) + 1;
      });
    });
    const topContexts = Object.entries(contextCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Weekly progress
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = entries.filter(e => e.collectionDate === dateStr);
      const completed = dayEntries.filter(e => e.type === 'task' && e.status === 'complete').length;
      
      weeklyProgress.push({
        date: date.toLocaleDateString('en', { weekday: 'short' }),
        entries: dayEntries.length,
        completed,
      });
    }

    // Migration stats
    const migratedEntries = filteredEntries.filter(e => e.status === 'migrated');
    const migrationStats = {
      totalMigrated: migratedEntries.length,
      averageMigrationTime: 0, // Could calculate based on transition history
    };

    return {
      totalEntries,
      completionRate,
      entriesByType,
      entriesByStatus,
      productivityStreak: streak,
      mostActiveDay,
      topTags,
      topContexts,
      weeklyProgress,
      monthlyTrend: [], // Would need more complex calculation
      migrationStats,
    };
  }, [entries, selectedPeriod]);

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  const renderStatCard = (title: string, value: string | number, subtitle?: string, icon?: string) => (
    <Card key={title} variant="elevated" style={styles.statCard}>
      <View style={styles.statCardContent}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={24}
            color={theme?.colors?.primary || '#0F2A44'}
            style={{ marginBottom: 8 }}
          />
        )}
        <Text style={styles.statValue}>
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
        </Text>
        <Text style={styles.statLabel}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </Card>
  );

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h2" color="text">
            Journal Analytics
          </Typography>
          <Typography variant="body" color="textSecondary">
            Insights into your bullet journal habits
          </Typography>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periods.map((period) => {
              const isActive = selectedPeriod === period.key;
              return (
                <TouchableOpacity
                  key={period.key}
                  style={[styles.periodChip, isActive && styles.periodChipActive]}
                  onPress={() => setSelectedPeriod(period.key as any)}
                >
                  <Text style={[styles.periodChipText, isActive && styles.periodChipTextActive]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Key Stats Grid */}
          <View style={styles.statsGrid}>
            {renderStatCard('Total Entries', analytics.totalEntries, 'All types', 'document-text-outline')}
            {renderStatCard('Completion Rate', `${analytics.completionRate.toFixed(0)}%`, 'Tasks completed', 'checkmark-circle-outline')}
            {renderStatCard('Active Streak', `${analytics.productivityStreak} days`, 'Consecutive days', 'flame-outline')}
            {renderStatCard('Most Active', analytics.mostActiveDay, 'Day of week', 'calendar-outline')}
          </View>

          {/* Weekly Progress Chart */}
          <Card variant="elevated" style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Typography variant="h3" color="text">
                Weekly Activity
              </Typography>
              <Ionicons name="bar-chart-outline" size={20} color={theme?.colors?.primary || '#0F2A44'} />
            </View>
            <View style={styles.weeklyChart}>
              {analytics.weeklyProgress.map((day, index) => {
                const maxEntries = Math.max(...analytics.weeklyProgress.map(d => d.entries), 1);
                const entryHeight = (day.entries / maxEntries) * 60;
                const completedHeight = day.entries > 0 ? (day.completed / day.entries) * entryHeight : 0;
                
                return (
                  <View key={index} style={styles.weeklyBar}>
                    <View style={[styles.weeklyBarFilled, { height: entryHeight }]}>
                      <View style={[styles.weeklyBarCompleted, { height: completedHeight }]} />
                    </View>
                    <Text style={styles.weeklyLabel}>{day.date}</Text>
                  </View>
                );
              })}
            </View>
            <Typography variant="caption1" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
              Blue: total entries, Green: completed tasks
            </Typography>
          </Card>

          {/* Entry Types Breakdown */}
          <Card variant="elevated" style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Typography variant="h3" color="text">
                Entry Types
              </Typography>
              <Ionicons name="pie-chart-outline" size={20} color={theme?.colors?.primary || '#0F2A44'} />
            </View>
            <View style={styles.chartContent}>
              {Object.entries(analytics.entriesByType).map(([type, count]) => {
                const percentage = (count / analytics.totalEntries) * 100;
                return (
                  <View key={type} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body" color="text" style={{ textTransform: 'capitalize' }}>
                        {type}
                      </Typography>
                      <Typography variant="caption1" color="textSecondary">
                        {count} ({percentage.toFixed(0)}%)
                      </Typography>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Top Tags */}
          {analytics.topTags.length > 0 && (
            <Card variant="elevated" style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Typography variant="h3" color="text">
                  Most Used Tags
                </Typography>
                <Ionicons name="pricetags-outline" size={20} color={theme?.colors?.primary || '#0F2A44'} />
              </View>
              <View style={styles.tagList}>
                {analytics.topTags.map((tag) => (
                  <View key={tag.name} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag.name}</Text>
                    <Text style={styles.tagCount}>{tag.count}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Top Contexts */}
          {analytics.topContexts.length > 0 && (
            <Card variant="elevated" style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Typography variant="h3" color="text">
                  Most Used Contexts
                </Typography>
                <Ionicons name="location-outline" size={20} color={theme?.colors?.primary || '#0F2A44'} />
              </View>
              <View style={styles.tagList}>
                {analytics.topContexts.map((context) => (
                  <View key={context.name} style={styles.tagChip}>
                    <Text style={styles.tagText}>{context.name}</Text>
                    <Text style={styles.tagCount}>{context.count}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Insight Card */}
          <Card variant="flat" style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Ionicons name="bulb-outline" size={24} color={theme?.colors?.primary || '#0F2A44'} />
            </View>
            <Typography variant="body" color="text" style={{ fontWeight: '600', marginBottom: 4 }}>
              Productivity Insight
            </Typography>
            <Typography variant="body" color="textSecondary">
              {analytics.completionRate > 80
                ? "Excellent task completion rate! You're staying on top of your commitments."
                : analytics.completionRate > 60
                ? "Good progress on tasks. Consider reviewing incomplete items for migration."
                : analytics.completionRate > 40
                ? "Many tasks remain incomplete. Try breaking them into smaller, manageable pieces."
                : "Focus on completing existing tasks before adding new ones."}
            </Typography>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};