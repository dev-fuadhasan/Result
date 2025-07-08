import { useState } from 'react';
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
  const { 
    resultStatus, 
    isSearching, 
    retrySearch, 
    resetSearch 
  } = useResultSearch();

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

        {/* Error Display */}
        <ErrorDisplay
          isVisible={!!showError}
          errorMessage={resultStatus?.errorMessage || 'An unexpected error occurred'}
          onRetry={handleRetry}
          onCheckStatus={handleCheckStatus}
        />

        {/* System Stats */}
        <SystemStats />
      </main>

      <Footer />
    </div>
  );
}
