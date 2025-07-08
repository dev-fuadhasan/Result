import { useQuery } from '@tanstack/react-query';
import { Gauge, CheckCircle, Users } from 'lucide-react';
import type { SystemStats } from '@/types/result';

export default function SystemStats() {
  const { data: statsData } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 10000, // Update every 10 seconds
  });

  const stats: SystemStats = (statsData as any)?.stats || {
    responseTime: "1.2s",
    successRate: "98.7%",
    activeUsers: 2847,
  };

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Gauge className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Response</p>
            <p className="text-lg font-semibold text-gray-900">{stats.responseTime}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-lg font-semibold text-gray-900">{stats.successRate}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-lg font-semibold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
