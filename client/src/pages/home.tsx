import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResultForm from '@/components/ResultForm';
import LoadingIndicator from '@/components/LoadingIndicator';
import ErrorDisplay from '@/components/ErrorDisplay';
import ResultDisplay from '@/components/ResultDisplay';
import SystemStats from '@/components/SystemStats';
import { TestAPI } from '@/components/TestAPI';
import { useResultSearch } from '@/hooks/useResultSearch';

export default function Home() {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const { 
    resultStatus, 
    isSearching, 
    retrySearch, 
    resetSearch 
  } = useResultSearch();

  // Add debug logging function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSearchStart = () => {
    setIsFormSubmitted(true);
  };

  const handleRetry = () => {
    resetSearch();
    setIsFormSubmitted(false);
  };

  const handleCheckStatus = () => {
    // TODO: Implement system status check
    console.log('Check system status');
  };

  const showLoading = isSearching || (isFormSubmitted && resultStatus?.status === 'pending');
  const showResult = resultStatus?.status === 'success' && resultStatus.resultData;
  const showError = resultStatus?.status === 'failed';

  // Debug logging
  console.log('[Home] Computed values:', {
    showLoading,
    showResult,
    showError,
    resultStatusStatus: resultStatus?.status,
    resultStatusResultData: resultStatus?.resultData,
  });

  // Add to debug logs
  useEffect(() => {
    addDebugLog(`State changed - showLoading: ${showLoading}, showResult: ${showResult}, showError: ${showError}`);
    addDebugLog(`resultStatus: ${JSON.stringify(resultStatus)}`);
  }, [showLoading, showResult, showError, resultStatus]);

  // Debug logging
  console.log('[Home] Debug info:', {
    isSearching,
    isFormSubmitted,
    resultStatus,
    showLoading,
    showResult,
    showError,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Alert Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-primary mb-1">High-Speed Result Retrieval</h3>
              <p className="text-sm text-blue-700">
                This system bypasses server overload issues. Results are fetched using optimized 
                multiple request strategies with automatic retry mechanisms.
              </p>
              <p className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded">
                <strong>Demo Mode:</strong> Test with Roll: 123456, Registration: 1234567890
              </p>
            </div>
          </div>
        </div>

        {/* API Test Panel (Temporary) */}
        <div className="mb-6">
          <TestAPI />
        </div>

        {/* Result Form */}
        <ResultForm onSearchStart={handleSearchStart} />

        {/* Loading Indicator */}
        <LoadingIndicator isVisible={showLoading} />

        {/* Result Display */}
        <ResultDisplay 
          isVisible={!!showResult} 
          resultData={resultStatus?.resultData || null} 
        />
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
            <pre>Debug: {JSON.stringify({ showResult, resultStatus }, null, 2)}</pre>
          </div>
        )}

        {/* Error Display */}
        <ErrorDisplay
          isVisible={!!showError}
          errorMessage={resultStatus?.errorMessage || 'An unexpected error occurred'}
          onRetry={handleRetry}
          onCheckStatus={handleCheckStatus}
        />

        {/* System Stats */}
        <SystemStats />

        {/* Debug Logs Section */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
          <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <p className="text-gray-500">No debug logs yet. Try searching for a result.</p>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-700 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <div className="mt-2 space-x-2">
            <button 
              onClick={() => setDebugLogs([])} 
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear Logs
            </button>
            <button 
              onClick={() => {
                addDebugLog('Manual test - Current resultStatus: ' + JSON.stringify(resultStatus));
                addDebugLog('Manual test - showResult: ' + showResult);
              }} 
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Test State
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
