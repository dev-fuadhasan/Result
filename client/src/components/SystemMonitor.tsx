import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface MonitoringData {
  health: {
    status: 'healthy' | 'warning' | 'critical';
    isHealthy: boolean;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    consecutiveFailures: number;
    captchaEnforcementDetected: boolean;
    successRate: number;
  };
  cache: {
    size: number;
    entries: number;
  };
  recommendations: string[];
}

export function SystemMonitor() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring');
      const data = await response.json();
      if (data.success) {
        setMonitoringData(data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMonitoringData();
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/admin/clear-cache', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchMonitoringData(); // Refresh data after clearing cache
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleResetMonitoring = async () => {
    try {
      const response = await fetch('/api/admin/reset-monitoring', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchMonitoringData(); // Refresh data after reset
      }
    } catch (error) {
      console.error('Failed to reset monitoring:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load monitoring data. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">System Monitor</h2>
          {getStatusIcon(monitoringData.health.status)}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            Clear Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMonitoring}
          >
            Reset Metrics
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>System Health</span>
            <Badge className={getStatusColor(monitoringData.health.status)}>
              {monitoringData.health.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {monitoringData.metrics.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {monitoringData.metrics.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {monitoringData.cache.size}
              </div>
              <div className="text-sm text-gray-600">Cached Results</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Total Requests</span>
                <span>{monitoringData.metrics.totalRequests}</span>
              </div>
              <Progress 
                value={monitoringData.metrics.totalRequests > 0 ? 
                  (monitoringData.metrics.successfulRequests / monitoringData.metrics.totalRequests) * 100 : 0
                } 
                className="h-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-green-600 font-semibold">
                  {monitoringData.metrics.successfulRequests}
                </div>
                <div className="text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-red-600 font-semibold">
                  {monitoringData.metrics.failedRequests}
                </div>
                <div className="text-gray-600">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {monitoringData.metrics.consecutiveFailures > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {monitoringData.metrics.consecutiveFailures} consecutive failures detected
                </AlertDescription>
              </Alert>
            )}
            {monitoringData.metrics.captchaEnforcementDetected && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Captcha enforcement detected on official site
                </AlertDescription>
              </Alert>
            )}
            {monitoringData.metrics.consecutiveFailures === 0 && !monitoringData.metrics.captchaEnforcementDetected && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No active alerts - system is running normally
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {monitoringData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {monitoringData.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 