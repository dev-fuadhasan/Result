import { Handler } from '@netlify/functions';
import { ResultFetcherService } from '../../server/services/resultFetcher';
import { CaptchaService } from '../../server/services/captchaService';
import { MonitoringService } from '../../server/services/monitoringService';

// Initialize services (all methods are static)

const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': event.headers.origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  console.log(`[Netlify Function] ${event.httpMethod} ${path}`);

  try {
    // Health check endpoint
    if (path === '/health' && event.httpMethod === 'GET') {
      const metrics = MonitoringService.getMetrics();
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          metrics,
        }),
      };
    }

    // Stats endpoint
    if (path === '/stats' && event.httpMethod === 'GET') {
      const metrics = MonitoringService.getMetrics();
      const stats = {
        responseTime: `${(metrics.averageResponseTime / 1000).toFixed(1)}s`,
        successRate: `${MonitoringService.getSuccessRate().toFixed(1)}%`,
        activeUsers: Math.floor(Math.random() * 5000) + 1000, // Mock data
      };
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          stats,
        }),
      };
    }

    // Captcha endpoints
    if (path === '/captcha') {
      if (event.httpMethod === 'GET') {
        const sessionToken = Date.now().toString();
        const captcha = CaptchaService.generateCaptcha(sessionToken);
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            captcha,
            sessionToken,
          }),
        };
      }

      if (event.httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        const { sessionToken } = body;
        
        if (!sessionToken) {
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              message: 'Session token is required',
            }),
          };
        }

        const newCaptcha = CaptchaService.refreshCaptcha(sessionToken);
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            captcha: newCaptcha,
            sessionToken,
          }),
        };
      }
    }

    // Result search endpoints
    if (path === '/result/search' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { board, exam, roll, registration, eiin, captcha, sessionToken } = body;

      // Validate required fields
      if (!board || !exam || !roll || !registration) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Board, exam, roll, and registration are required',
          }),
        };
      }

      // Validate captcha
      if (!captcha || !sessionToken) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Security code is required',
          }),
        };
      }

      const isValidCaptcha = CaptchaService.validateCaptcha(sessionToken, captcha);
      if (!isValidCaptcha) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Invalid security code. Please try again.',
          }),
        };
      }

      // Generate request ID and start fetching
      const requestId = Date.now();
      
      // Start the result fetching process
      try {
        const result = await ResultFetcherService.fetchResult({
          board,
          exam,
          roll,
          registration,
          eiin,
        });

        // Store the result temporarily (in a real app, you'd use a database)
        // For now, we'll return the result directly
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            requestId,
            status: 'success',
            result,
          }),
        };
      } catch (error) {
        console.error('[Netlify Function] Result fetch error:', error);
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            requestId,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Failed to fetch result',
          }),
        };
      }
    }

    // Result status endpoint
    if (path === '/result/status' && event.httpMethod === 'GET') {
      const requestId = event.queryStringParameters?.requestId;
      
      if (!requestId) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Request ID is required',
          }),
        };
      }

      // For now, return a simple status
      // In a real implementation, you'd check the actual status from a database
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          requestId: parseInt(requestId),
          status: 'completed',
          message: 'Result processing completed',
        }),
      };
    }

    // 404 for unknown endpoints
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Endpoint not found',
      }),
    };

  } catch (error) {
    console.error('[Netlify Function] Error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
      }),
    };
  }
};

export { handler }; 