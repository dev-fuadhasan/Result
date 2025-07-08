import { AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  isVisible: boolean;
  errorMessage: string;
  onRetry: () => void;
  onCheckStatus: () => void;
}

export default function ErrorDisplay({ 
  isVisible, 
  errorMessage, 
  onRetry, 
  onCheckStatus 
}: ErrorDisplayProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800 mb-2">Unable to Retrieve Result</h3>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Now
              </Button>
              <Button 
                onClick={onCheckStatus}
                variant="outline"
                className="border-gray-600 text-gray-600 hover:bg-gray-50"
              >
                <Activity className="w-4 h-4 mr-2" />
                Check System Status
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
