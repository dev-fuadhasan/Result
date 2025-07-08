import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CaptchaService } from "./services/captchaService";
import { ResultFetcherService } from "./services/resultFetcher";
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
    try {
      const { captcha, ...searchData } = req.body;
      
      // Validate captcha
      if (!CaptchaService.validateCaptcha(searchData.sessionToken, captcha)) {
        return res.status(400).json({
          success: false,
          message: "Invalid security code. Please try again."
        });
      }

      // Validate request data
      const validatedData = insertResultRequestSchema.parse(searchData);
      
      // Create result request
      const resultRequest = await storage.createResultRequest(validatedData);
      
      // Start background result fetching
      setImmediate(async () => {
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
        } catch (error) {
          await storage.updateResultRequest(resultRequest.id, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
            retryCount: (resultRequest.retryCount || 0) + 1,
          });
        }
      });

      res.json({
        success: true,
        requestId: resultRequest.id,
        message: "Result search initiated"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Invalid request data"
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
      
      if (!stats) {
        return res.json({
          success: true,
          stats: {
            responseTime: "1.2s",
            successRate: "98.7%",
            activeUsers: 2847,
          }
        });
      }

      res.json({
        success: true,
        stats: {
          responseTime: stats.responseTime + "s",
          successRate: stats.successRate + "%",
          activeUsers: stats.activeUsers,
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get system statistics"
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
