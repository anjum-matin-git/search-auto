import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.all("/api/*", async (req, res) => {
    const url = `http://127.0.0.1:3000${req.url}`;
    
    try {
      const response = await fetch(url, {
        method: req.method,
        headers: {
          ...req.headers as Record<string, string>,
          host: "127.0.0.1:3000",
        },
        body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
      });

      const contentType = response.headers.get("content-type");
      res.status(response.status);
      
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      res.status(500).json({ error: "Proxy error: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
