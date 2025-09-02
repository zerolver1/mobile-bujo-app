// BuJo Pro Methodology Service
// Provides BuJo methodology compliance, insights, and advanced features

import { BuJoEntry } from '../types/BuJo';
import { bujoSyncService } from './supabase/BuJoSyncService';

export interface BuJoInsight {
  type: 'productivity' | 'methodology' | 'wellbeing' | 'organization';
  title: string;
  description: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  recommendation?: string;
}

export interface MigrationChain {
  originalEntry: BuJoEntry;
  currentEntry: BuJoEntry;
  migrationCount: number;
  migrationPath: string[];
  reasons: string[];
}

export interface EntryTransition {
  transitionType: string;
  fromStatus: string;
  toStatus: string;
  fromDate: Date;
  toDate: Date;
  createdAt: Date;
  reason: string;
}

export class BuJoProService {
  
  // Get BuJo Pro insights and analytics
  async getInsights(entries: BuJoEntry[], timeRange: 'week' | 'month' | 'year' = 'month'): Promise<BuJoInsight[]> {
    const insights: BuJoInsight[] = [];
    
    // Filter entries by time range
    const cutoffDate = new Date();
    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }
    
    const recentEntries = entries.filter(entry => 
      entry.createdAt >= cutoffDate
    );

    // Productivity Insights
    const completionRate = this.calculateCompletionRate(recentEntries);
    insights.push({
      type: 'productivity',
      title: 'Task Completion Rate',
      description: `You complete ${Math.round(completionRate * 100)}% of your tasks`,
      value: completionRate,
      trend: completionRate > 0.7 ? 'up' : completionRate > 0.5 ? 'stable' : 'down',
      recommendation: completionRate < 0.6 ? 'Consider breaking large tasks into smaller, actionable items' : undefined
    });

    // Migration Analysis (BuJo Core Methodology)
    const migrationRate = this.calculateMigrationRate(recentEntries);
    insights.push({
      type: 'methodology',
      title: 'Migration Rate',
      description: `${Math.round(migrationRate * 100)}% of tasks are migrated forward`,
      value: migrationRate,
      trend: migrationRate < 0.3 ? 'up' : migrationRate > 0.6 ? 'down' : 'stable',
      recommendation: migrationRate > 0.5 ? 'High migration rate suggests overcommitment. Consider realistic daily planning.' : undefined
    });

    // Entry Type Distribution
    const typeDistribution = this.calculateTypeDistribution(recentEntries);
    const balanceScore = this.calculateLifeBalanceScore(typeDistribution);
    insights.push({
      type: 'wellbeing',
      title: 'Life Balance Score',
      description: 'Balance between tasks, events, notes, and memories',
      value: balanceScore,
      trend: balanceScore > 0.7 ? 'up' : balanceScore > 0.5 ? 'stable' : 'down',
      recommendation: balanceScore < 0.6 ? 'Consider adding more variety to your journal entries' : undefined
    });

    // Research and Investigation Insights
    const researchEntries = recentEntries.filter(e => e.type === 'research');
    const investigationRate = researchEntries.filter(e => e.status === 'complete').length / Math.max(researchEntries.length, 1);
    if (researchEntries.length > 0) {
      insights.push({
        type: 'methodology',
        title: 'Research Investigation Rate',
        description: `You investigate ${Math.round(investigationRate * 100)}% of your research items`,
        value: investigationRate,
        trend: investigationRate > 0.6 ? 'up' : 'stable',
        recommendation: investigationRate < 0.4 ? 'Consider setting specific times for research and investigation' : undefined
      });
    }

    // Gratitude and Memory Tracking
    const memoryEntries = recentEntries.filter(e => e.type === 'memory' || e.tags?.includes('gratitude'));
    const memoryFrequency = memoryEntries.length / Math.max(recentEntries.length, 1);
    insights.push({
      type: 'wellbeing',
      title: 'Mindfulness & Gratitude',
      description: `${Math.round(memoryFrequency * 100)}% of entries focus on gratitude/memories`,
      value: memoryFrequency,
      trend: memoryFrequency > 0.15 ? 'up' : 'stable',
      recommendation: memoryFrequency < 0.1 ? 'Consider adding daily gratitude or memory entries for wellbeing' : undefined
    });

    return insights;
  }

  // Get entry transition history (requires database)
  async getEntryTransitions(entryId: string): Promise<EntryTransition[]> {
    try {
      const history = await bujoSyncService.getEntryHistory(entryId);
      return history.map(h => ({
        transitionType: h.transition_type,
        fromStatus: h.from_status,
        toStatus: h.to_status,
        fromDate: new Date(h.from_collection_date),
        toDate: new Date(h.to_collection_date),
        createdAt: new Date(h.created_at),
        reason: h.transition_reason
      }));
    } catch (error) {
      console.warn('Failed to get entry transitions:', error);
      return [];
    }
  }

  // Validate BuJo methodology compliance
  validateBuJoMethodology(entries: BuJoEntry[]): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for proper task lifecycle
    const tasks = entries.filter(e => e.type === 'task');
    const incompleteTasks = tasks.filter(e => e.status === 'incomplete');
    const oldTasks = incompleteTasks.filter(e => {
      const age = Date.now() - e.createdAt.getTime();
      return age > 7 * 24 * 60 * 60 * 1000; // 7 days
    });

    if (oldTasks.length > 0) {
      violations.push(`${oldTasks.length} tasks older than 7 days without migration or completion`);
      recommendations.push('Review old tasks and migrate them to future log or mark as cancelled');
    }

    // Check for entry type balance
    const typeDistribution = this.calculateTypeDistribution(entries);
    if (typeDistribution.task > 0.8) {
      violations.push('Over 80% of entries are tasks - lacking balance');
      recommendations.push('Add more notes, events, and reflection entries for better balance');
    }

    // Check for proper signifier usage
    const tasksWithoutSignifiers = tasks.filter(e => !e.priority || e.priority === 'none');
    if (tasksWithoutSignifiers.length > tasks.length * 0.5) {
      recommendations.push('Consider using priority signifiers (* for important tasks)');
    }

    // Check for migration patterns
    const migrationRate = this.calculateMigrationRate(entries);
    if (migrationRate > 0.6) {
      violations.push('High migration rate indicates overcommitment');
      recommendations.push('Focus on realistic daily planning and break large tasks down');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  // Calculate completion rate for tasks
  private calculateCompletionRate(entries: BuJoEntry[]): number {
    const tasks = entries.filter(e => e.type === 'task');
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(e => e.status === 'complete');
    return completed.length / tasks.length;
  }

  // Calculate migration rate (BuJo methodology metric)
  private calculateMigrationRate(entries: BuJoEntry[]): number {
    const tasks = entries.filter(e => e.type === 'task');
    if (tasks.length === 0) return 0;
    
    const migrated = tasks.filter(e => e.status === 'migrated');
    return migrated.length / tasks.length;
  }

  // Calculate entry type distribution
  private calculateTypeDistribution(entries: BuJoEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {
      task: 0,
      event: 0,
      note: 0,
      inspiration: 0,
      research: 0,
      memory: 0,
    };

    if (entries.length === 0) return distribution;

    entries.forEach(entry => {
      if (distribution.hasOwnProperty(entry.type)) {
        distribution[entry.type]++;
      }
    });

    // Convert to percentages
    Object.keys(distribution).forEach(key => {
      distribution[key] = distribution[key] / entries.length;
    });

    return distribution;
  }

  // Calculate life balance score based on entry variety
  private calculateLifeBalanceScore(typeDistribution: Record<string, number>): number {
    const weights = {
      task: 0.3,      // Productivity
      event: 0.2,     // Social/Planning
      note: 0.2,      // Learning/Reflection
      inspiration: 0.1, // Creativity
      research: 0.1,  // Growth
      memory: 0.1,    // Wellbeing
    };

    // Calculate weighted balance (penalize extremes)
    let balance = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([type, weight]) => {
      const proportion = typeDistribution[type] || 0;
      // Ideal proportion with some tolerance
      const ideal = weight;
      const deviation = Math.abs(proportion - ideal);
      const score = Math.max(0, 1 - (deviation * 2)); // Penalize deviation
      balance += score * weight;
      totalWeight += weight;
    });

    return balance / totalWeight;
  }

  // Get BuJo methodology recommendations
  getMethodologyRecommendations(entries: BuJoEntry[]): string[] {
    const recommendations: string[] = [];
    const validation = this.validateBuJoMethodology(entries);
    
    recommendations.push(...validation.recommendations);

    // Weekly/Monthly review recommendations
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(e => e.createdAt >= weekAgo);
    
    if (recentEntries.length === 0) {
      recommendations.push('Consider daily logging - even small entries help maintain the habit');
    }

    // Reflection recommendations
    const reflectionEntries = entries.filter(e => 
      e.type === 'note' && (
        e.content.toLowerCase().includes('reflect') ||
        e.content.toLowerCase().includes('learn') ||
        e.content.toLowerCase().includes('realize')
      )
    );

    if (reflectionEntries.length / Math.max(entries.length, 1) < 0.1) {
      recommendations.push('Add more reflection notes to capture learnings and insights');
    }

    return recommendations;
  }

  // Export insights to various formats
  async exportInsights(insights: BuJoInsight[], format: 'json' | 'csv' | 'markdown' = 'json'): Promise<string> {
    switch (format) {
      case 'csv':
        const csvHeader = 'Type,Title,Description,Value,Trend,Recommendation\n';
        const csvRows = insights.map(insight => 
          `${insight.type},${insight.title},"${insight.description}",${insight.value},${insight.trend || ''},${insight.recommendation || ''}`
        ).join('\n');
        return csvHeader + csvRows;

      case 'markdown':
        let markdown = '# BuJo Pro Insights\n\n';
        insights.forEach(insight => {
          markdown += `## ${insight.title}\n`;
          markdown += `**Type:** ${insight.type}\n`;
          markdown += `**Value:** ${Math.round(insight.value * 100)}%\n`;
          if (insight.trend) markdown += `**Trend:** ${insight.trend}\n`;
          markdown += `\n${insight.description}\n\n`;
          if (insight.recommendation) {
            markdown += `💡 **Recommendation:** ${insight.recommendation}\n\n`;
          }
        });
        return markdown;

      case 'json':
      default:
        return JSON.stringify(insights, null, 2);
    }
  }
}

// Singleton instance
export const bujoProService = new BuJoProService();