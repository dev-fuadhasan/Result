import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CaptchaService } from "./services/captchaService";
import { ResultFetcherService } from "./services/resultFetcher";
import { MonitoringService } from "./services/monitoringService";
import { insertResultRequestSchema } from "@shared/schema";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate captcha endpoint
  app.get("/api/captcha", async (req, res) => {
    try {
      const sessionToken = req.query.session as string || nanoid();
      const captcha = CaptchaService.generateCaptcha(sessionToken);
      
      res.json({
        success: true,
        captcha,
        sessionToken,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate captcha"
      });
    }
  });

  // Refresh captcha endpoint
  app.post("/api/captcha/refresh", async (req, res) => {
    try {
      const { sessionToken } = req.body;
      if (!sessionToken) {
        return res.status(400).json({
          success: false,
          message: "Session token is required"
        });
      }

      const captcha = CaptchaService.refreshCaptcha(sessionToken);
      
      res.json({
        success: true,
        captcha,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to refresh captcha"
      });
    }
  });

  // Submit result search
  app.post("/api/result/search", async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { captcha, ...searchData } = req.body;
      
      // Validate captcha
      if (!CaptchaService.validateCaptcha(searchData.sessionToken, captcha)) {
        const responseTime = Date.now() - startTime;
        MonitoringService.recordRequest(false, responseTime, "Invalid security code");
        
        return res.status(400).json({
          success: false,
          message: "Invalid security code. Please try again."
        });
      }

      // Validate request data
      const validatedData = insertResultRequestSchema.parse(searchData);
      
      // Create result request
      const resultRequest = await storage.createResultRequest(validatedData);
      
      // Start background result fetching with monitoring
      setImmediate(async () => {
        const fetchStartTime = Date.now();
        
        try {
          const resultData = await ResultFetcherService.fetchResult({
            board: validatedData.board,
            exam: validatedData.exam,
            roll: validatedData.roll,
            registration: validatedData.registration,
            eiin: validatedData.eiin || undefined,
          });

          await storage.updateResultRequest(resultRequest.id, {
            status: "success",
            resultData: resultData as any,
          });

          const fetchResponseTime = Date.now() - fetchStartTime;
          MonitoringService.recordRequest(true, fetchResponseTime);
          
        } catch (error) {
          const fetchResponseTime = Date.now() - fetchStartTime;
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          
          await storage.updateResultRequest(resultRequest.id, {
            status: "failed",
            errorMessage,
            retryCount: (resultRequest.retryCount || 0) + 1,
          });

          MonitoringService.recordRequest(false, fetchResponseTime, errorMessage);
        }
      });

      const responseTime = Date.now() - startTime;
      MonitoringService.recordRequest(true, responseTime);

      res.json({
        success: true,
        requestId: resultRequest.id,
        message: "Result search initiated"
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Invalid request data";
      MonitoringService.recordRequest(false, responseTime, errorMessage);
      
      res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
  });

  // Get result status
  app.get("/api/result/status/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const resultRequest = await storage.getResultRequest(requestId);
      
      if (!resultRequest) {
        return res.status(404).json({
          success: false,
          message: "Result request not found"
        });
      }

      res.json({
        success: true,
        status: resultRequest.status,
        resultData: resultRequest.resultData,
        errorMessage: resultRequest.errorMessage,
        retryCount: resultRequest.retryCount,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get result status"
      });
    }
  });

  // Get system statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getLatestSystemStats();
      const monitoringMetrics = MonitoringService.getMetrics();
      const cacheStats = ResultFetcherService.getCacheStats();
      
      if (!stats) {
        res.json({
          success: true,
          stats: {
            responseTime: "1.2s",
            successRate: "98.7%",
            activeUsers: 2847,
          },
          monitoring: {
            healthStatus: MonitoringService.getHealthStatus(),
            successRate: MonitoringService.getSuccessRate().toFixed(1) + "%",
            totalRequests: monitoringMetrics.totalRequests,
            cacheSize: cacheStats.size,
          }
        });
        return;
      }

      res.json({
        success: true,
        stats: {
          responseTime: stats.responseTime + "s",
          successRate: stats.successRate + "%",
          activeUsers: stats.activeUsers,
        },
        monitoring: {
          healthStatus: MonitoringService.getHealthStatus(),
          successRate: MonitoringService.getSuccessRate().toFixed(1) + "%",
          totalRequests: monitoringMetrics.totalRequests,
          averageResponseTime: monitoringMetrics.averageResponseTime.toFixed(2) + "ms",
          cacheSize: cacheStats.size,
          consecutiveFailures: monitoringMetrics.consecutiveFailures,
          captchaEnforcementDetected: monitoringMetrics.captchaEnforcementDetected,
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get system statistics"
      });
    }
  });

  // Get detailed monitoring metrics
  app.get("/api/monitoring", async (req, res) => {
    try {
      const metrics = MonitoringService.getMetrics();
      const healthStatus = MonitoringService.getHealthStatus();
      const cacheStats = ResultFetcherService.getCacheStats();
      
      res.json({
        success: true,
        health: {
          status: healthStatus,
          isHealthy: MonitoringService.isHealthy(),
        },
        metrics: {
          ...metrics,
          successRate: MonitoringService.getSuccessRate(),
        },
        cache: cacheStats,
        recommendations: healthStatus === 'critical' ? [
          'Captcha enforcement detected on official site',
          'Consider implementing captcha solving service',
          'Look for alternative data sources',
          'Monitor official site for changes'
        ] : healthStatus === 'warning' ? [
          'Multiple consecutive failures detected',
          'Check if official site has changed',
          'Consider implementing retry logic with delays',
          'Monitor for captcha enforcement'
        ] : [
          'System is healthy',
          'Continue monitoring for changes',
          'Consider implementing additional fallback sources'
        ]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get monitoring data"
      });
    }
  });

  // Clear cache endpoint (admin only)
  app.post("/api/admin/clear-cache", async (req, res) => {
    try {
      // TODO: Add proper authentication/authorization
      ResultFetcherService.clearCache();
      
      res.json({
        success: true,
        message: "Cache cleared successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to clear cache"
      });
    }
  });

  // Reset monitoring metrics (admin only)
  app.post("/api/admin/reset-monitoring", async (req, res) => {
    try {
      // TODO: Add proper authentication/authorization
      MonitoringService.resetMetrics();
      
      res.json({
        success: true,
        message: "Monitoring metrics reset successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to reset monitoring metrics"
      });
    }
  });

  // Update system statistics (internal endpoint)
  app.post("/api/stats/update", async (req, res) => {
    try {
      const { responseTime, successRate, activeUsers } = req.body;
      
      await storage.updateSystemStats({
        responseTime,
        successRate,
        activeUsers,
      });

      res.json({
        success: true,
        message: "Statistics updated"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update statistics"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
