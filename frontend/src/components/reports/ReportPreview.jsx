import React from 'react';
import { formatDate, formatCurrency, formatMiles } from '../../utils/formatters';
import Card from '../common/Card';
import Button from '../common/Button';

/**
 * ReportPreview Component
 * Preview generated report with download options
 * 
 * @param {object} report - Report data
 * @param {function} onDownload - Download handler
 * @param {function} onDelete - Delete handler
 * @param {boolean} isLoading - Loading state
 */
const ReportPreview = ({ report, onDownload, onDelete, isLoading }) => {
  if (!report) return null;

  const getStatusBadge = (status) => {
    const styles = {
      processing: 'bg-warning-100 text-warning-800',
      completed: 'bg-success-100 text-success-800',
      failed: 'bg-danger-100 text-danger-800'
    };
    return styles[status] || styles.processing;
  };

  const getFormatIcon = (format) => {
    if (format === 'pdf') {
      return (
        <svg className="w-8 h-8 text-danger-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-success-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {getFormatIcon(report.format)}
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">{report.name}</h3>
              <p className="text-sm text-gray-500">
                Generated on {formatDate(report.createdAt)}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(report.status)}`}>
            {report.status}
          </span>
        </div>
      </div>

      {/* Report Details */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {formatMiles(report.totalMiles)}
            </p>
            <p className="text-xs text-gray-500">Total Miles</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-success-600">
              {formatCurrency(report.totalAmount)}
            </p>
            <p className="text-xs text-gray-500">Total Claim</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Date Range</span>
            <span className="font-medium">
              {formatDate(report.dateFrom)} - {formatDate(report.dateTo)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Number of Trips</span>
            <span className="font-medium">{report.tripCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Format</span>
            <span className="font-medium uppercase">{report.format}</span>
          </div>
          {report.taxYear && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tax Year</span>
              <span className="font-medium">{report.taxYear}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {report.status === 'completed' && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex space-x-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => onDownload(report.id)}
              isLoading={isLoading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                onClick={() => onDelete(report.id)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

/**
 * ReportPreview.List - List of reports
 */
ReportPreview.List = ({ reports, onDownload, onDelete, isLoading }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
        <p className="text-gray-600">Generate your first mileage report</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map(report => (
        <ReportPreview
          key={report.id}
          report={report}
          onDownload={onDownload}
          onDelete={onDelete}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default ReportPreview;
