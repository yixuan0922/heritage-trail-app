import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTrailSchema,
  insertWaypointSchema,
  insertVisitorPhotoSchema,
  insertCampaignSchema,
  insertRouteSchema,
  insertCampaignMarkerSchema,
  insertRouteMarkerSchema,
  insertQuestionSchema,
  insertCampaignProgressSchema,
  insertQuestionAttemptSchema,
} from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";
import crypto from "crypto";

// Helper function to generate a short alphanumeric verification code
function generateVerificationCode(): string {
  // Generate 6-character code with uppercase letters and numbers
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

  // ==================== GAME MODE ENDPOINTS ====================

  // User location endpoints
  app.put("/api/users/:userId/location", async (req, res) => {
    try {
      const { latitude, longitude, campaignId } = z.object({
        latitude: z.number(),
        longitude: z.number(),
        campaignId: z.string().optional(),
      }).parse(req.body);

      const user = await storage.updateUserLocation(req.params.userId, latitude, longitude, campaignId);
      res.json(user);
    } catch (error) {
      console.error("Error updating user location:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/users/locations", async (req, res) => {
    try {
      // This endpoint should be protected - only admins should access it
      const users = await storage.getAllUsersWithLocation();
      // Remove passwords before sending
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching user locations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/campaigns/:campaignId/users", async (req, res) => {
    try {
      // This endpoint should be protected - only admins should access it
      const users = await storage.getUsersInCampaign(req.params.campaignId);
      // Remove passwords before sending
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching campaign users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = z.object({
        username: z.string().min(3),
        email: z.string().email().optional(),
        password: z.string().min(6),
        role: z.enum(["user", "admin"]).default("user"),
      }).parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // In production, hash the password!
      const user = await storage.createUser(validatedData);

      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error registering user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByUsername(validatedData.username);

      if (!user || user.password !== validatedData.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error logging in:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Campaign endpoints
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/campaigns/active", async (req, res) => {
    try {
      const campaigns = await storage.getActiveCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching active campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Campaign Markers endpoints
  app.get("/api/campaigns/:campaignId/markers", async (req, res) => {
    try {
      const markers = await storage.getCampaignMarkersByCampaignId(req.params.campaignId);
      res.json(markers);
    } catch (error) {
      console.error("Error fetching campaign markers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/campaign-markers/:id", async (req, res) => {
    try {
      const marker = await storage.getCampaignMarkerById(req.params.id);
      if (!marker) {
        return res.status(404).json({ error: "Campaign marker not found" });
      }
      res.json(marker);
    } catch (error) {
      console.error("Error fetching campaign marker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/campaign-markers", async (req, res) => {
    try {
      const validatedData = insertCampaignMarkerSchema.parse(req.body);
      const marker = await storage.createCampaignMarker(validatedData);
      res.status(201).json(marker);
    } catch (error) {
      console.error("Error creating campaign marker:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/campaign-markers/:id", async (req, res) => {
    try {
      const marker = await storage.updateCampaignMarker(req.params.id, req.body);
      res.json(marker);
    } catch (error) {
      console.error("Error updating campaign marker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/campaign-markers/:id", async (req, res) => {
    try {
      await storage.deleteCampaignMarker(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign marker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Route endpoints
  app.get("/api/campaigns/:campaignId/routes", async (req, res) => {
    try {
      const routes = await storage.getRoutesByCampaignId(req.params.campaignId);
      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/routes/:id", async (req, res) => {
    try {
      const route = await storage.getRouteById(req.params.id);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      console.error("Error fetching route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/routes", async (req, res) => {
    try {
      const validatedData = insertRouteSchema.parse(req.body);
      const route = await storage.createRoute(validatedData);
      res.status(201).json(route);
    } catch (error) {
      console.error("Error creating route:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/routes/:id", async (req, res) => {
    try {
      const route = await storage.updateRoute(req.params.id, req.body);
      res.json(route);
    } catch (error) {
      console.error("Error updating route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/routes/:id", async (req, res) => {
    try {
      await storage.deleteRoute(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Route Marker endpoints
  app.get("/api/routes/:routeId/markers", async (req, res) => {
    try {
      // Return markers with full waypoint or campaign marker details
      const markers = await storage.getMarkersWithDetailsByRouteId(req.params.routeId);
      res.json(markers);
    } catch (error) {
      console.error("Error fetching markers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/markers/:id", async (req, res) => {
    try {
      const marker = await storage.getMarkerById(req.params.id);
      if (!marker) {
        return res.status(404).json({ error: "Marker not found" });
      }
      res.json(marker);
    } catch (error) {
      console.error("Error fetching marker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/markers", async (req, res) => {
    try {
      const validatedData = insertRouteMarkerSchema.parse(req.body);
      const marker = await storage.createRouteMarker(validatedData);
      res.status(201).json(marker);
    } catch (error) {
      console.error("Error creating marker:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/markers/:id", async (req, res) => {
    try {
      const marker = await storage.updateRouteMarker(req.params.id, req.body);
      res.json(marker);
    } catch (error) {
      console.error("Error updating marker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/markers/:id", async (req, res) => {
    try {
      await storage.deleteRouteMarker(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting marker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Question endpoints
  app.get("/api/markers/:markerId/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestionsByMarkerId(req.params.markerId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestionById(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.updateQuestion(req.params.id, req.body);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Campaign Progress endpoints
  app.get("/api/users/:userId/campaign-progress", async (req, res) => {
    try {
      const progresses = await storage.getUserCampaignProgresses(req.params.userId);
      res.json(progresses);
    } catch (error) {
      console.error("Error fetching campaign progresses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/campaigns/:campaignId/progress", async (req, res) => {
    try {
      const progress = await storage.getCampaignProgress(
        req.params.userId,
        req.params.campaignId
      );
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
      res.json(progress);
    } catch (error) {
      console.error("Error fetching campaign progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/campaign-progress", async (req, res) => {
    try {
      const validatedData = insertCampaignProgressSchema.parse(req.body);

      // Generate a unique verification code
      let verificationCode = generateVerificationCode();
      let attempts = 0;
      // Ensure uniqueness (very unlikely to collide, but let's be safe)
      while (attempts < 10) {
        const existing = await storage.getCampaignProgressByVerificationCode(verificationCode);
        if (!existing) break;
        verificationCode = generateVerificationCode();
        attempts++;
      }

      const progress = await storage.createCampaignProgress({
        ...validatedData,
        verificationCode,
      });
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating campaign progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/campaign-progress/:id", async (req, res) => {
    try {
      const progress = await storage.updateCampaignProgress(req.params.id, req.body);
      res.json(progress);
    } catch (error) {
      console.error("Error updating campaign progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/campaigns/:campaignId/progress", async (req, res) => {
    try {
      // This endpoint should be protected - only admins should access it
      const progresses = await storage.getCampaignProgressByCampaignId(req.params.campaignId);
      res.json(progresses);
    } catch (error) {
      console.error("Error fetching campaign progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Question Attempt endpoints
  app.get("/api/campaign-progress/:progressId/attempts", async (req, res) => {
    try {
      const attempts = await storage.getAttemptsByProgress(req.params.progressId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/question-attempts", async (req, res) => {
    try {
      const validatedData = insertQuestionAttemptSchema.parse(req.body);

      // Get the question to check if answer is correct
      const question = await storage.getQuestionById(validatedData.questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      // Check if answer is correct
      const isCorrect = validatedData.userAnswer.toLowerCase().trim() ===
                       question.correctAnswer.toLowerCase().trim();
      const pointsEarned = isCorrect ? question.points : 0;

      const attemptData = {
        ...validatedData,
        isCorrect,
        pointsEarned,
      };

      const attempt = await storage.createQuestionAttempt(attemptData);

      // Update campaign progress score
      const progress = await storage.getCampaignProgressById(validatedData.campaignProgressId);
      if (progress) {
        await storage.updateCampaignProgress(validatedData.campaignProgressId, {
          totalScore: progress.totalScore + pointsEarned,
        });
      }

      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error creating question attempt:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // QR Code endpoints
  app.get("/api/campaign-progress/:progressId/qrcode", async (req, res) => {
    try {
      const progress = await storage.getCampaignProgressById(req.params.progressId);
      if (!progress) {
        return res.status(404).json({ error: "Campaign progress not found" });
      }

      // Create a verification token that includes progress ID, user ID, and campaign ID
      const verificationData = {
        progressId: progress.id,
        userId: progress.userId,
        campaignId: progress.campaignId,
        timestamp: Date.now(),
      };

      // Encode as base64 for QR code
      const token = Buffer.from(JSON.stringify(verificationData)).toString('base64');

      // Create full URL using PRODUCTION_URL from environment
      const productionUrl = process.env.PRODUCTION_URL || 'http://localhost:5001';
      const qrUrl = `${productionUrl}/admin/qr-scanner?token=${encodeURIComponent(token)}`;

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
      });

      res.json({
        qrCode: qrCodeDataUrl,
        token,
        url: qrUrl,
        progressId: progress.id,
        verificationCode: progress.verificationCode,
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/verify-qr", async (req, res) => {
    try {
      const { token, verificationCode, adminId } = req.body;

      if ((!token && !verificationCode) || !adminId) {
        return res.status(400).json({ error: "Token or verification code and adminId are required" });
      }

      // Verify admin
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized: Admin access required" });
      }

      let progress;

      // Check if it's a verification code (short alphanumeric string)
      if (verificationCode) {
        progress = await storage.getCampaignProgressByVerificationCode(verificationCode.toUpperCase().trim());
        if (!progress) {
          return res.status(404).json({ error: "Invalid verification code" });
        }
      } else {
        // Decode token with better error handling
        console.log("Received token:", token);
        console.log("Token length:", token.length);

        let verificationData;
        try {
          const decoded = Buffer.from(token, 'base64').toString();
          console.log("Decoded string:", decoded);
          verificationData = JSON.parse(decoded);
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
          return res.status(400).json({ error: "Invalid token format" });
        }

        // Get campaign progress
        progress = await storage.getCampaignProgressById(verificationData.progressId);
        if (!progress) {
          return res.status(404).json({ error: "Campaign progress not found" });
        }

        // Verify the data matches
        if (progress.userId !== verificationData.userId ||
            progress.campaignId !== verificationData.campaignId) {
          return res.status(400).json({ error: "Invalid QR code data" });
        }
      }

      // Get user and campaign details
      const user = await storage.getUser(progress.userId);
      const campaign = await storage.getCampaignById(progress.campaignId);

      res.json({
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
        },
        campaign: {
          id: campaign?.id,
          name: campaign?.name,
        },
        progress: {
          id: progress.id,
          totalScore: progress.totalScore,
          isCompleted: progress.isCompleted,
          pointsCollected: progress.pointsCollected,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
        },
      });
    } catch (error) {
      console.error("Error verifying QR code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/mark-points-collected", async (req, res) => {
    try {
      const { progressId, adminId } = req.body;

      if (!progressId || !adminId) {
        return res.status(400).json({ error: "progressId and adminId are required" });
      }

      // Verify admin
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized: Admin access required" });
      }

      // Update campaign progress
      const updatedProgress = await storage.updateCampaignProgress(progressId, {
        pointsCollected: true,
        collectedBy: adminId,
        collectedAt: new Date(),
      });

      res.json(updatedProgress);
    } catch (error) {
      console.error("Error marking points as collected:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
