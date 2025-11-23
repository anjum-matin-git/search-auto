import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchCars } from "./lib/car-search-agent";
import { createEmbedding } from "./lib/openai-client";
import { signup, login } from "./lib/auth";
import { insertSearchSchema, insertUserPreferencesSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, postalCode, location, initialPreferences } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }

      const user = await signup({
        username,
        email,
        password,
        postalCode,
        location,
        initialPreferences,
      });

      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ error: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await login(email, password);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({ error: error.message || "Login failed" });
    }
  });

  app.get("/api/cars/nearby", async (req, res) => {
    try {
      const { location, limit } = req.query;
      
      if (!location || typeof location !== "string") {
        return res.status(400).json({ error: "Location is required" });
      }

      const cars = await storage.findCarsByLocation(location, parseInt(limit as string) || 10);
      res.json({ success: true, cars });
    } catch (error: any) {
      console.error("Nearby cars error:", error);
      res.status(500).json({ error: error.message || "Failed to find nearby cars" });
    }
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { query, userId } = req.body;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      console.log(`🚗 Starting AI car search for: "${query}"`);
      
      const cars = await searchCars(query, userId || null);
      
      res.json({
        success: true,
        query,
        count: cars.length,
        results: cars.map((car, index) => ({
          ...car,
          match: Math.max(70, 98 - index * 3),
        })),
      });
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({ error: error.message || "Search failed" });
    }
  });

  app.get("/api/search/history", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const searches = await storage.getUserSearches(userId, 20);
      res.json({ success: true, searches });
    } catch (error: any) {
      console.error("History error:", error);
      res.status(500).json({ error: error.message || "Failed to get history" });
    }
  });

  app.get("/api/search/:searchId/results", async (req, res) => {
    try {
      const searchId = parseInt(req.params.searchId);
      
      if (isNaN(searchId)) {
        return res.status(400).json({ error: "Invalid search ID" });
      }

      const results = await storage.getSearchResults(searchId);
      res.json({ success: true, results });
    } catch (error: any) {
      console.error("Results error:", error);
      res.status(500).json({ error: error.message || "Failed to get results" });
    }
  });

  app.get("/api/preferences/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const preferences = await storage.getUserPreferences(userId);
      res.json({ success: true, preferences });
    } catch (error: any) {
      console.error("Preferences error:", error);
      res.status(500).json({ error: error.message || "Failed to get preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      const validatedData = insertUserPreferencesSchema.parse(req.body);
      const preferences = await storage.upsertUserPreferences(validatedData);
      res.json({ success: true, preferences });
    } catch (error: any) {
      console.error("Preferences update error:", error);
      res.status(500).json({ error: error.message || "Failed to update preferences" });
    }
  });

  app.get("/api/cars/similar", async (req, res) => {
    try {
      const { query, limit } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      const embedding = await createEmbedding(query);
      const cars = await storage.findSimilarCars(embedding, parseInt(limit as string) || 10);
      
      res.json({ success: true, cars });
    } catch (error: any) {
      console.error("Similar cars error:", error);
      res.status(500).json({ error: error.message || "Failed to find similar cars" });
    }
  });

  app.get("/api/cars/:carId", async (req, res) => {
    try {
      const carId = parseInt(req.params.carId);
      
      if (isNaN(carId)) {
        return res.status(400).json({ error: "Invalid car ID" });
      }

      const car = await storage.getCarById(carId);
      
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }

      res.json({ success: true, car });
    } catch (error: any) {
      console.error("Car details error:", error);
      res.status(500).json({ error: error.message || "Failed to get car details" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
