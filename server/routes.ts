import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:3000",
      changeOrigin: false,
    })
  );

  const httpServer = createServer(app);

  return httpServer;
}
