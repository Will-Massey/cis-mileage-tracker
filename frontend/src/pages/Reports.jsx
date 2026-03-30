import React, { useEffect, useState } from 'react';
import reportService from '../services/reportService';
import ReportForm from '../components/reports/ReportForm';
import ReportPreview from '../components/reports/ReportPreview';
import Loading from '../components/common/Loading';

/**
 * Reports Page
 * Generate and manage mileage reports
 */
const Reports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);

  // Load existing reports
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await reportService.getReports({ limit: 10 });
      setReports(response.data?.reports || []);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (formData) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const response = await reportService.generateMileageReport(formData);
      
      // Poll for report completion
      if (response.data?.id) {
        try {
          const completedReport = await reportService.pollReportStatus(response.data.id);
          setGeneratedReport(completedReport.data);
          // Refresh reports list
          await loadReports();
        } catch (pollError) {
          setError('Report generation is taking longer than expected. Please check back later.');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await reportService.downloadReport(reportId);
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'report.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportService.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      if (generatedReport?.id === reportId) {
        setGeneratedReport(null);
      }
    } catch (err) {
      setError('Failed to delete report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Generate Report Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Generate New Report
          </h2>
          <ReportForm
            onSubmit={handleGenerateReport}
            isLoading={isGenerating}
            error={error}
          />
        </div>

        {/* Generated Report Preview */}
        {generatedReport && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Generated Report
            </h2>
            <ReportPreview
              report={generatedReport}
              onDownload={handleDownload}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Previous Reports */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Previous Reports
          </h2>
          
          {isLoading && reports.length === 0 ? (
            <Loading.List items={3} />
          ) : (
            <ReportPreview.List
              reports={reports}
              onDownload={handleDownload}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Help Text */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">About Reports</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• PDF reports are formatted for printing and sharing with your accountant</li>
            <li>• CSV files can be opened in Excel or Google Sheets</li>
            <li>• Reports include all trip details required by HMRC</li>
            <li>• Downloaded reports are available for 30 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;
