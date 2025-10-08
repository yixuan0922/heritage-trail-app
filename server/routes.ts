import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTrailSchema,
  insertWaypointSchema,
  insertVisitorPhotoSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Trails endpoints
  app.get("/api/trails", async (req, res) => {
    try {
      const trails = await storage.getAllTrails();
      res.json(trails);
    } catch (error) {
      console.error("Error fetching trails:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/trails/:id", async (req, res) => {
    try {
      const trail = await storage.getTrailById(req.params.id);
      if (!trail) {
        return res.status(404).json({ error: "Trail not found" });
      }
      res.json(trail);
    } catch (error) {
      console.error("Error fetching trail:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/trails", async (req, res) => {
    try {
      const validatedData = insertTrailSchema.parse(req.body);
      const trail = await storage.createTrail(validatedData);
      res.status(201).json(trail);
    } catch (error) {
      console.error("Error creating trail:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Waypoints endpoints
  app.get("/api/trails/:trailId/waypoints", async (req, res) => {
    try {
      const waypoints = await storage.getWaypointsByTrailId(req.params.trailId);
      res.json(waypoints);
    } catch (error) {
      console.error("Error fetching waypoints:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/waypoints/:id", async (req, res) => {
    try {
      const waypoint = await storage.getWaypointById(req.params.id);
      if (!waypoint) {
        return res.status(404).json({ error: "Waypoint not found" });
      }
      res.json(waypoint);
    } catch (error) {
      console.error("Error fetching waypoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/waypoints", async (req, res) => {
    try {
      const validatedData = insertWaypointSchema.parse(req.body);
      const waypoint = await storage.createWaypoint(validatedData);
      res.status(201).json(waypoint);
    } catch (error) {
      console.error("Error creating waypoint:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Visitor photos endpoints
  app.get("/api/waypoints/:waypointId/photos", async (req, res) => {
    try {
      const photos = await storage.getPhotosByWaypointId(req.params.waypointId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/visitor-photos", async (req, res) => {
    try {
      const validatedData = insertVisitorPhotoSchema.parse(req.body);
      const photo = await storage.createVisitorPhoto(validatedData);
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error creating visitor photo:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User progress endpoints
  app.get("/api/users/:userId/progress/:trailId", async (req, res) => {
    try {
      const progress = await storage.getUserProgress(
        req.params.userId,
        req.params.trailId
      );
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/user-progress", async (req, res) => {
    try {
      const validatedData = z
        .object({
          userId: z.string(),
          trailId: z.string(),
          currentWaypointId: z.string().optional(),
        })
        .parse(req.body);

      const progress = await storage.createUserProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating user progress:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/user-progress/:id", async (req, res) => {
    try {
      const validatedData = z
        .object({
          completedWaypoints: z.array(z.string()).optional(),
          currentWaypointId: z.string().optional().nullable(),
          completedAt: z.string().optional().nullable(),
        })
        .parse(req.body);

      const updateData: Partial<{
        completedWaypoints: string[];
        currentWaypointId: string | null;
        completedAt: Date | null;
      }> = {
        ...validatedData,
        completedAt: validatedData.completedAt
          ? new Date(validatedData.completedAt)
          : null,
      };

      const progress = await storage.updateUserProgress(
        req.params.id,
        updateData
      );
      res.json(progress);
    } catch (error) {
      console.error("Error updating user progress:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
