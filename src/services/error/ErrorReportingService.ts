import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'OCR_PARSE_ERROR' | 'NETWORK_ERROR' | 'APP_CRASH' | 'USER_REPORTED';
  message: string;
  stack?: string;
  context?: {
    screen?: string;
    action?: string;
    imageUri?: string;
    ocrResult?: any;
    userAgent?: string;
    appVersion?: string;
  };
  userFeedback?: string;
  resolved: boolean;
}

class ErrorReportingService {
  private readonly STORAGE_KEY = 'error_reports';
  private readonly MAX_STORED_ERRORS = 50;

  /**
   * Report an error with context
   */
  async reportError(
    type: ErrorReport['type'],
    message: string,
    context?: ErrorReport['context'],
    stack?: string
  ): Promise<string> {
    const errorId = this.generateErrorId();
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date(),
      type,
      message,
      stack,
      context: {
        ...context,
        appVersion: '1.0.0', // Should come from app config
        userAgent: 'BuJo Pro iOS', // Should be determined dynamically
      },
      resolved: false,
    };

    try {
      await this.storeErrorReport(errorReport);
      console.log('Error reported:', errorId, message);
      
      // In production, you might want to send to analytics service
      // await this.sendToAnalytics(errorReport);
      
      return errorId;
    } catch (error) {
      console.error('Failed to report error:', error);
      throw error;
    }
  }

  /**
   * Report OCR parsing errors specifically
   */
  async reportOCRError(
    message: string,
    imageUri: string,
    ocrResult: any,
    userFeedback?: string
  ): Promise<string> {
    return this.reportError(
      'OCR_PARSE_ERROR',
      message,
      {
        imageUri,
        ocrResult,
        screen: 'EntryReview',
        action: 'OCR_PROCESSING',
      }
    );
  }

  /**
   * Allow users to provide feedback on errors
   */
  async addUserFeedback(errorId: string, feedback: string): Promise<void> {
    const reports = await this.getStoredErrorReports();
    const reportIndex = reports.findIndex(r => r.id === errorId);
    
    if (reportIndex !== -1) {
      reports[reportIndex].userFeedback = feedback;
      await this.storeErrorReports(reports);
    }
  }

  /**
   * Mark an error as resolved
   */
  async resolveError(errorId: string): Promise<void> {
    const reports = await this.getStoredErrorReports();
    const reportIndex = reports.findIndex(r => r.id === errorId);
    
    if (reportIndex !== -1) {
      reports[reportIndex].resolved = true;
      await this.storeErrorReports(reports);
    }
  }

  /**
   * Get all stored error reports
   */
  async getErrorReports(includeResolved: boolean = false): Promise<ErrorReport[]> {
    const reports = await this.getStoredErrorReports();
    
    if (includeResolved) {
      return reports;
    }
    
    return reports.filter(r => !r.resolved);
  }

  /**
   * Get error reports by type
   */
  async getErrorReportsByType(type: ErrorReport['type']): Promise<ErrorReport[]> {
    const reports = await this.getStoredErrorReports();
    return reports.filter(r => r.type === type && !r.resolved);
  }

  /**
   * Get recent error reports (last 24 hours)
   */
  async getRecentErrorReports(): Promise<ErrorReport[]> {
    const reports = await this.getStoredErrorReports();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return reports.filter(r => 
      new Date(r.timestamp) > yesterday && !r.resolved
    );
  }

  /**
   * Clear all error reports
   */
  async clearAllErrorReports(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get error statistics for analytics
   */
  async getErrorStats(): Promise<{
    total: number;
    byType: Record<ErrorReport['type'], number>;
    resolved: number;
    recent: number;
  }> {
    const reports = await this.getStoredErrorReports();
    const recent = await this.getRecentErrorReports();
    
    const byType = reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<ErrorReport['type'], number>);

    return {
      total: reports.length,
      byType,
      resolved: reports.filter(r => r.resolved).length,
      recent: recent.length,
    };
  }

  /**
   * Export error reports for debugging
   */
  async exportErrorReports(): Promise<string> {
    const reports = await this.getStoredErrorReports();
    return JSON.stringify(reports, null, 2);
  }

  // Private methods

  private async storeErrorReport(errorReport: ErrorReport): Promise<void> {
    const existingReports = await this.getStoredErrorReports();
    const updatedReports = [errorReport, ...existingReports].slice(0, this.MAX_STORED_ERRORS);
    await this.storeErrorReports(updatedReports);
  }

  private async getStoredErrorReports(): Promise<ErrorReport[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const reports = JSON.parse(stored) as ErrorReport[];
      // Convert timestamp strings back to Date objects
      return reports.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get stored error reports:', error);
      return [];
    }
  }

  private async storeErrorReports(reports: ErrorReport[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to store error reports:', error);
      throw error;
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async sendToAnalytics(errorReport: ErrorReport): Promise<void> {
    // In production, implement analytics service integration
    // Examples: Firebase Analytics, Bugsnag, Sentry, etc.
    
    try {
      // Example implementation:
      // await analytics().logEvent('app_error', {
      //   error_type: errorReport.type,
      //   error_message: errorReport.message.substring(0, 100),
      //   screen: errorReport.context?.screen,
      //   action: errorReport.context?.action,
      // });
      
      console.log('Analytics event logged for error:', errorReport.id);
    } catch (error) {
      console.error('Failed to send error to analytics:', error);
    }
  }
}

export const errorReportingService = new ErrorReportingService();

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
  
  global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    errorReportingService.reportError(
      'APP_CRASH',
      error.message,
      {
        action: 'GLOBAL_ERROR_HANDLER',
      },
      error.stack
    ).catch(console.error);

    // Call original handler to maintain default behavior
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}