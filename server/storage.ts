import { resultRequests, systemStats, type ResultRequest, type InsertResultRequest, type SystemStats, type InsertSystemStats } from "@shared/schema";

export interface IStorage {
  // Result requests
  createResultRequest(request: InsertResultRequest): Promise<ResultRequest>;
  getResultRequest(id: number): Promise<ResultRequest | undefined>;
  updateResultRequest(id: number, data: Partial<ResultRequest>): Promise<ResultRequest | undefined>;
  getResultRequestBySession(sessionToken: string): Promise<ResultRequest | undefined>;
  
  // System stats
  getLatestSystemStats(): Promise<SystemStats | undefined>;
  updateSystemStats(stats: InsertSystemStats): Promise<SystemStats>;
}

export class MemStorage implements IStorage {
  private resultRequests: Map<number, ResultRequest>;
  private systemStats: SystemStats | undefined;
  private currentId: number;

  constructor() {
    this.resultRequests = new Map();
    this.currentId = 1;
    
    // Initialize with default stats
    this.systemStats = {
      id: 1,
      responseTime: "1.2",
      successRate: "98.7",
      activeUsers: 2847,
      updatedAt: new Date(),
    };
  }

  async createResultRequest(insertRequest: InsertResultRequest): Promise<ResultRequest> {
    const id = this.currentId++;
    const request: ResultRequest = {
      ...insertRequest,
      id,
      status: "pending",
      resultData: null,
      errorMessage: null,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.resultRequests.set(id, request);
    return request;
  }

  async getResultRequest(id: number): Promise<ResultRequest | undefined> {
    return this.resultRequests.get(id);
  }

  async updateResultRequest(id: number, data: Partial<ResultRequest>): Promise<ResultRequest | undefined> {
    const existing = this.resultRequests.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.resultRequests.set(id, updated);
    return updated;
  }

  async getResultRequestBySession(sessionToken: string): Promise<ResultRequest | undefined> {
    return Array.from(this.resultRequests.values()).find(
      (request) => request.sessionToken === sessionToken
    );
  }

  async getLatestSystemStats(): Promise<SystemStats | undefined> {
    return this.systemStats;
  }

  async updateSystemStats(stats: InsertSystemStats): Promise<SystemStats> {
    this.systemStats = {
      id: 1,
      ...stats,
      updatedAt: new Date(),
    };
    return this.systemStats;
  }
}

export const storage = new MemStorage();
