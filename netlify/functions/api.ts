import { Handler } from '@netlify/functions';

// Simple in-memory storage for captchas
const captchas = new Map<string, string>();

// Simple captcha service
class SimpleCaptchaService {
  static generateCaptcha(sessionToken: string): string {
    const captcha = Math.floor(1000 + Math.random() * 9000).toString();
    captchas.set(sessionToken, captcha);
    
    // Auto-expire after 10 minutes
    setTimeout(() => {
      captchas.delete(sessionToken);
    }, 10 * 60 * 1000);
    
    return captcha;
  }

  static validateCaptcha(sessionToken: string, userInput: string): boolean {
    const correctCaptcha = captchas.get(sessionToken);
    if (!correctCaptcha) return false;
    
    const isValid = correctCaptcha === userInput;
    if (isValid) {
      captchas.delete(sessionToken); // Use once
    }
    
    return isValid;
  }

  static refreshCaptcha(sessionToken: string): string {
    return this.generateCaptcha(sessionToken);
  }
}

// Simple monitoring service
class SimpleMonitoringService {
  private static metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
  };

  static recordRequest(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }
}

// Simple result fetcher (returns demo data for now)
class SimpleResultFetcher {
  static async fetchResult(params: any): Promise<any> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return demo result
    return {
      studentName: "MD. DEMO STUDENT",
      fatherName: "MD. DEMO FATHER",
      motherName: "MST. DEMO MOTHER",
      roll: params.roll,
      registration: params.registration,
      institution: "DEMO HIGH SCHOOL",
      group: "Science",
      session: "2024",
      gpa: "4.83",
      grade: "A+",
      result: "PASSED",
      subjects: [
        { name: "Bangla", marks: "82", grade: "A+", gpa: "5.00" },
        { name: "English", marks: "78", grade: "A", gpa: "4.00" },
        { name: "Mathematics", marks: "85", grade: "A+", gpa: "5.00" },
        { name: "Physics", marks: "80", grade: "A+", gpa: "5.00" },
        { name: "Chemistry", marks: "79", grade: "A", gpa: "4.00" },
        { name: "Biology", marks: "83", grade: "A+", gpa: "5.00" },
        { name: "ICT", marks: "88", grade: "A+", gpa: "5.00" },
      ]
    };
  }
}

const handler: Handler = async (event, context) => {
  const startTime = Date.now();
  
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
      const metrics = SimpleMonitoringService.getMetrics();
      SimpleMonitoringService.recordRequest(true, Date.now() - startTime);
      
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
      const metrics = SimpleMonitoringService.getMetrics();
      const stats = {
        responseTime: `${(metrics.averageResponseTime / 1000).toFixed(1)}s`,
        successRate: `${SimpleMonitoringService.getSuccessRate().toFixed(1)}%`,
        activeUsers: Math.floor(Math.random() * 5000) + 1000, // Mock data
      };
      SimpleMonitoringService.recordRequest(true, Date.now() - startTime);
      
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
        const captcha = SimpleCaptchaService.generateCaptcha(sessionToken);
        SimpleMonitoringService.recordRequest(true, Date.now() - startTime);
        
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
          SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              message: 'Session token is required',
            }),
          };
        }

        const newCaptcha = SimpleCaptchaService.refreshCaptcha(sessionToken);
        SimpleMonitoringService.recordRequest(true, Date.now() - startTime);
        
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
        SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
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
        SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Security code is required',
          }),
        };
      }

      const isValidCaptcha = SimpleCaptchaService.validateCaptcha(sessionToken, captcha);
      if (!isValidCaptcha) {
        SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
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
      
      try {
        const result = await SimpleResultFetcher.fetchResult({
          board,
          exam,
          roll,
          registration,
          eiin,
        });

        SimpleMonitoringService.recordRequest(true, Date.now() - startTime);
        
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
        SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
        
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
        SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Request ID is required',
          }),
        };
      }

      SimpleMonitoringService.recordRequest(true, Date.now() - startTime);
      
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
    SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
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
    SimpleMonitoringService.recordRequest(false, Date.now() - startTime);
    
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