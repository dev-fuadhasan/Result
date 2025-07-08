import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  isVisible: boolean;
}

export default function LoadingIndicator({ isVisible }: LoadingIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Connecting to education board servers...');

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setStatusMessage('Connecting to education board servers...');
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 15 + 5;
        const newProgress = Math.min(prev + increment, 95);
        
        if (newProgress < 30) {
          setStatusMessage('Connecting to education board servers...');
        } else if (newProgress < 60) {
          setStatusMessage('Authenticating and processing request...');
        } else if (newProgress < 85) {
          setStatusMessage('Retrieving result data...');
        } else {
          setStatusMessage('Finalizing result display...');
        }
        
        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="mt-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="font-medium text-gray-900">Searching for your result...</p>
            <p className="text-sm text-gray-600">{statusMessage}</p>
          </div>
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
