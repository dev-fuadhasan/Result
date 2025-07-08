import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resultRequests = pgTable("result_requests", {
  id: serial("id").primaryKey(),
  board: text("board").notNull(),
  exam: text("exam").notNull(),
  roll: text("roll").notNull(),
  registration: text("registration").notNull(),
  eiin: text("eiin"),
  sessionToken: text("session_token").notNull(),
  status: text("status").notNull().default("pending"), // pending, success, failed
  resultData: json("result_data"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  responseTime: text("response_time").notNull(),
  successRate: text("success_rate").notNull(),
  activeUsers: integer("active_users").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertResultRequestSchema = createInsertSchema(resultRequests).pick({
  board: true,
  exam: true,
  roll: true,
  registration: true,
  eiin: true,
  sessionToken: true,
});

export const insertSystemStatsSchema = createInsertSchema(systemStats).pick({
  responseTime: true,
  successRate: true,
  activeUsers: true,
});

export type InsertResultRequest = z.infer<typeof insertResultRequestSchema>;
export type ResultRequest = typeof resultRequests.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;
export type SystemStats = typeof systemStats.$inferSelect;
