import { ResultFetcherService } from './resultFetcher';

export interface HealthMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  consecutiveFailures: number;
  captchaEnforcementDetected: boolean;
}

export class MonitoringService {
  private static metrics: HealthMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    consecutiveFailures: 0,
    captchaEnforcementDetected: false,
  };

  private static readonly ALERT_THRESHOLD = 5; // Alert after 5 consecutive failures
  private static readonly CAPTCHA_DETECTION_KEYWORDS = [
    'captcha', 'security code', 'verification', 'robot', 'automated',
    'please enter the code', 'enter the number', 'human verification'
  ];

  static recordRequest(success: boolean, responseTime: number, errorMessage?: string): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.consecutiveFailures = 0;
      this.metrics.lastSuccessTime = new Date();
    } else {
      this.metrics.failedRequests++;
      this.metrics.consecutiveFailures++;
      this.metrics.lastFailureTime = new Date();
      
      // Check if this might be captcha enforcement
      if (errorMessage && this.isCaptchaEnforcement(errorMessage)) {
        this.metrics.captchaEnforcementDetected = true;
        this.alertCaptchaEnforcement();
      }
    }

    // Update average response time
    this.updateAverageResponseTime(responseTime);

    // Alert if too many consecutive failures
    if (this.metrics.consecutiveFailures >= this.ALERT_THRESHOLD) {
      this.alertConsecutiveFailures();
    }
  }

  private static isCaptchaEnforcement(errorMessage: string): boolean {
    const lowerMessage = errorMessage.toLowerCase();
    return this.CAPTCHA_DETECTION_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }

  private static updateAverageResponseTime(newResponseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + newResponseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }

  private static alertConsecutiveFailures(): void {
    console.error(`[MONITORING] ALERT: ${this.metrics.consecutiveFailures} consecutive failures detected!`);
    console.error(`[MONITORING] Last failure time: ${this.metrics.lastFailureTime}`);
    console.error(`[MONITORING] This might indicate the official site has changed its behavior.`);
    
    // You can add email/SMS/webhook notifications here
    this.sendAlert('consecutive_failures', {
      count: this.metrics.consecutiveFailures,
      lastFailure: this.metrics.lastFailureTime,
    });
  }

  private static alertCaptchaEnforcement(): void {
    console.error(`[MONITORING] CRITICAL ALERT: Captcha enforcement detected on the official site!`);
    console.error(`[MONITORING] Your result fetching service may stop working.`);
    console.error(`[MONITORING] Consider implementing captcha solving or finding alternative data sources.`);
    
    this.sendAlert('captcha_enforcement', {
      detectedAt: new Date(),
      recommendation: 'Implement captcha solving or find alternative data sources',
    });
  }

  private static sendAlert(type: string, data: any): void {
    // TODO: Implement actual alert sending (email, SMS, webhook, etc.)
    // For now, just log to console
    console.log(`[ALERT] Type: ${type}, Data:`, data);
    
    // Example webhook implementation:
    // try {
    //   await axios.post('https://your-webhook-url.com/alerts', {
    //     type,
    //     data,
    //     timestamp: new Date().toISOString(),
    //   });
    // } catch (error) {
    //   console.error('Failed to send alert:', error);
    // }
  }

  static getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  static getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  static resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      consecutiveFailures: 0,
      captchaEnforcementDetected: false,
    };
  }

  static isHealthy(): boolean {
    return this.metrics.consecutiveFailures < this.ALERT_THRESHOLD && 
           !this.metrics.captchaEnforcementDetected;
  }

  static getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.metrics.captchaEnforcementDetected) return 'critical';
    if (this.metrics.consecutiveFailures >= this.ALERT_THRESHOLD) return 'warning';
    return 'healthy';
  }
} 