import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function TestAPI() {
  const [healthStatus, setHealthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [captchaStatus, setCaptchaStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [healthData, setHealthData] = useState<any>(null);
  const [captchaData, setCaptchaData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testHealth = async () => {
    setHealthStatus('loading');
    setError('');
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.success) {
        setHealthData(data);
        setHealthStatus('success');
      } else {
        setError(data.message || 'Health check failed');
        setHealthStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setHealthStatus('error');
    }
  };

  const testCaptcha = async () => {
    setCaptchaStatus('loading');
    setError('');
    
    try {
      const response = await fetch('/api/captcha');
      const data = await response.json();
      
      if (data.success) {
        setCaptchaData(data);
        setCaptchaStatus('success');
      } else {
        setError(data.message || 'Captcha generation failed');
        setCaptchaStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setCaptchaStatus('error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Test Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Check Test */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Health Check</h3>
              <p className="text-sm text-gray-600">Test if the API is running</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthStatus)}
              <Button 
                onClick={testHealth} 
                disabled={healthStatus === 'loading'}
                size="sm"
              >
                Test Health
              </Button>
            </div>
          </div>

          {/* Captcha Test */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Captcha Generation</h3>
              <p className="text-sm text-gray-600">Test captcha generation</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(captchaStatus)}
              <Button 
                onClick={testCaptcha} 
                disabled={captchaStatus === 'loading'}
                size="sm"
              >
                Test Captcha
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {healthData && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">Health Check Result:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}

          {captchaData && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">Captcha Result:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(captchaData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 