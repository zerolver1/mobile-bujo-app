// BuJo Pro Insights Screen
// Shows methodology compliance, insights, and advanced analytics

import React, { useState, useEffect } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import { PaperBackground } from '../../components/ui/paperComponents/PaperBackground';
import { NotebookCard } from '../../components/ui/paperComponents/NotebookCard';
import { Typography } from '../../components/ui/Typography';
import { PaperButton } from '../../components/ui/paperComponents/PaperButton';
import { useTheme } from '../../theme';

// Services and Stores
import { useBuJoStore } from '../../stores/BuJoStore';
import { bujoProService, BuJoInsight } from '../../services/BuJoProService';

interface InsightCardProps {
  insight: BuJoInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { theme } = useTheme();

  const getStyles = () => {
    if (!theme?.colors || !theme?.spacing) {
      return {
        container: { marginBottom: 16, padding: 16 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        valueContainer: { alignItems: 'center' },
        trendIndicator: { marginLeft: 8 },
      };
    }

    return {
      container: {
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.lg,
      },
      header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: theme.spacing.sm,
      },
      valueContainer: {
        alignItems: 'center' as const,
        marginVertical: theme.spacing.sm,
      },
      trendIndicator: {
        marginLeft: theme.spacing.sm,
      },
      recommendationContainer: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.bujo.highlight + '20',
        borderRadius: 4,
      },
    };
  };

  const styles = getStyles();

  const getTrendEmoji = (trend?: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'productivity': return '⚡';
      case 'methodology': return '📚';
      case 'wellbeing': return '🌱';
      case 'organization': return '🗂️';
      default: return '💡';
    }
  };

  return (
    <NotebookCard variant="page" style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h3" color="text">
          {getTypeEmoji(insight.type)} {insight.title}
        </Typography>
        <View style={styles.trendIndicator}>
          <Typography variant="h2" color="text">
            {getTrendEmoji(insight.trend)}
          </Typography>
        </View>
      </View>

      <View style={styles.valueContainer}>
        <Typography variant="h1" color="bujoTask">
          {Math.round(insight.value * 100)}%
        </Typography>
      </View>

      <Typography variant="body" color="textSecondary">
        {insight.description}
      </Typography>

      {insight.recommendation && (
        <View style={styles.recommendationContainer}>
          <Typography variant="caption1" color="text" style={{ fontWeight: '600' }}>
            💡 Recommendation:
          </Typography>
          <Typography variant="caption1" color="textSecondary">
            {insight.recommendation}
          </Typography>
        </View>
      )}
    </NotebookCard>
  );
};

export const BuJoProInsightsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { entries } = useBuJoStore();
  const [insights, setInsights] = useState<BuJoInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [methodologyCompliance, setMethodologyCompliance] = useState<{
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } | null>(null);

  const getStyles = () => {
    if (!theme?.colors || !theme?.spacing) {
      return {
        container: { flex: 1, padding: 16 },
        header: { marginBottom: 16, padding: 20, alignItems: 'center' },
        timeRangeContainer: { flexDirection: 'row', marginBottom: 16, justifyContent: 'center' },
        complianceContainer: { marginBottom: 16, padding: 16 },
        violationItem: { marginVertical: 2 },
        recommendationItem: { marginVertical: 2 },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
      };
    }

    return {
      container: {
        flex: 1,
        padding: theme.spacing.lg,
      },
      header: {
        marginBottom: theme.spacing.xl,
        padding: theme.spacing.xl,
        alignItems: 'center' as const,
      },
      timeRangeContainer: {
        flexDirection: 'row' as const,
        marginBottom: theme.spacing.lg,
        justifyContent: 'center' as const,
      },
      complianceContainer: {
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.lg,
      },
      violationItem: {
        marginVertical: theme.spacing.xs,
      },
      recommendationItem: {
        marginVertical: theme.spacing.xs,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      },
    };
  };

  const styles = getStyles();

  useEffect(() => {
    loadInsights();
  }, [entries, timeRange]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [insightsData, complianceData] = await Promise.all([
        bujoProService.getInsights(entries, timeRange),
        Promise.resolve(bujoProService.validateBuJoMethodology(entries))
      ]);

      setInsights(insightsData);
      setMethodologyCompliance(complianceData);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportInsights = async () => {
    try {
      const markdown = await bujoProService.exportInsights(insights, 'markdown');
      console.log('Exported insights:', markdown);
      // In a real app, you'd save this to a file or share it
    } catch (error) {
      console.error('Failed to export insights:', error);
    }
  };

  if (loading) {
    return (
      <PaperBackground variant="subtle" intensity="light">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme?.colors?.primary || '#007AFF'} />
            <Typography variant="body" color="textSecondary" style={{ marginTop: 16 }}>
              Analyzing your BuJo methodology...
            </Typography>
          </View>
        </SafeAreaView>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          
          {/* Header */}
          <NotebookCard variant="page" style={styles.header}>
            <Typography variant="h1" color="text" style={{ textAlign: 'center', marginBottom: 8 }}>
              📊 BuJo Pro Insights
            </Typography>
            <Typography variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
              Advanced analytics and methodology compliance
            </Typography>
          </NotebookCard>

          {/* Time Range Selector */}
          <View style={styles.timeRangeContainer}>
            {['week', 'month', 'year'].map((range) => (
              <PaperButton
                key={range}
                variant={timeRange === range ? 'ink' : 'pencil'}
                size="sm"
                title={range.charAt(0).toUpperCase() + range.slice(1)}
                onPress={() => setTimeRange(range as 'week' | 'month' | 'year')}
                style={{ marginHorizontal: 4 }}
              />
            ))}
          </View>

          {/* Methodology Compliance */}
          {methodologyCompliance && (
            <NotebookCard variant="page" style={styles.complianceContainer}>
              <Typography variant="h2" color="text" style={{ marginBottom: 12 }}>
                {methodologyCompliance.isCompliant ? '✅' : '⚠️'} BuJo Methodology Compliance
              </Typography>
              
              {methodologyCompliance.violations.length > 0 && (
                <>
                  <Typography variant="h4" color="bujoTaskCancelled" style={{ marginBottom: 8 }}>
                    Methodology Violations:
                  </Typography>
                  {methodologyCompliance.violations.map((violation, index) => (
                    <Typography key={index} variant="caption1" color="textSecondary" style={styles.violationItem}>
                      • {violation}
                    </Typography>
                  ))}
                </>
              )}

              {methodologyCompliance.recommendations.length > 0 && (
                <>
                  <Typography variant="h4" color="bujoEvent" style={{ marginTop: 12, marginBottom: 8 }}>
                    Recommendations:
                  </Typography>
                  {methodologyCompliance.recommendations.map((recommendation, index) => (
                    <Typography key={index} variant="caption1" color="textSecondary" style={styles.recommendationItem}>
                      💡 {recommendation}
                    </Typography>
                  ))}
                </>
              )}
            </NotebookCard>
          )}

          {/* Insights Cards */}
          {insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}

          {/* Export Button */}
          <NotebookCard variant="sticky" style={{ marginTop: 16, marginBottom: 32, alignItems: 'center' }}>
            <Typography variant="h4" color="text" style={{ marginBottom: 12 }}>
              Export Insights
            </Typography>
            <PaperButton
              variant="highlight"
              size="md"
              title="Export as Markdown"
              onPress={exportInsights}
            />
          </NotebookCard>

        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};