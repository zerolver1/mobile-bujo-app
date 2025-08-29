import { useState } from 'react';
import { errorReportingService, ErrorReport } from '../services/error/ErrorReportingService';

export const useErrorReporting = () => {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [currentError, setCurrentError] = useState<{
    type: ErrorReport['type'];
    message: string;
    context?: ErrorReport['context'];
  } | null>(null);

  const reportError = async (
    type: ErrorReport['type'],
    message: string,
    context?: ErrorReport['context']
  ) => {
    return await errorReportingService.reportError(type, message, context);
  };

  const reportOCRError = async (
    message: string,
    imageUri: string,
    ocrResult: any,
    userFeedback?: string
  ) => {
    return await errorReportingService.reportOCRError(
      message,
      imageUri,
      ocrResult,
      userFeedback
    );
  };

  const showReportModal = (
    type: ErrorReport['type'],
    message: string,
    context?: ErrorReport['context']
  ) => {
    setCurrentError({ type, message, context });
    setIsReportModalVisible(true);
  };

  const hideReportModal = () => {
    setIsReportModalVisible(false);
    setCurrentError(null);
  };

  const getRecentErrors = async () => {
    return await errorReportingService.getRecentErrorReports();
  };

  const getErrorStats = async () => {
    return await errorReportingService.getErrorStats();
  };

  return {
    // Modal state
    isReportModalVisible,
    currentError,
    showReportModal,
    hideReportModal,

    // Reporting functions
    reportError,
    reportOCRError,

    // Query functions
    getRecentErrors,
    getErrorStats,
  };
};