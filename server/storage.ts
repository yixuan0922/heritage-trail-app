import {
  users, trails, waypoints, userProgress, visitorPhotos,
  campaigns, routes, campaignMarkers, routeMarkers, questions, campaignProgress, questionAttempts,
  type User, type InsertUser,
  type Trail, type InsertTrail,
  type Waypoint, type InsertWaypoint,
  type UserProgress, type InsertUserProgress,
  type VisitorPhoto, type InsertVisitorPhoto,
  type Campaign, type InsertCampaign,
  type Route, type InsertRoute,
  type CampaignMarker, type InsertCampaignMarker,
  type RouteMarker, type InsertRouteMarker,
  type Question, type InsertQuestion,
  type CampaignProgress, type InsertCampaignProgress,
  type QuestionAttempt, type InsertQuestionAttempt
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLocation(userId: string, latitude: number, longitude: number, campaignId?: string): Promise<User>;
  getAllUsersWithLocation(): Promise<User[]>;
  getUsersInCampaign(campaignId: string): Promise<User[]>;

  // Trails
  getAllTrails(): Promise<Trail[]>;
  getTrailById(id: string): Promise<Trail | undefined>;
  createTrail(trail: InsertTrail): Promise<Trail>;

  // Waypoints
  getWaypointsByTrailId(trailId: string): Promise<Waypoint[]>;
  getWaypointById(id: string): Promise<Waypoint | undefined>;
  createWaypoint(waypoint: InsertWaypoint): Promise<Waypoint>;
  updateWaypoint(id: string, waypoint: Partial<Waypoint>): Promise<Waypoint>;

  // User Progress
  getUserProgress(userId: string, trailId: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: string, progress: Partial<UserProgress>): Promise<UserProgress>;

  // Visitor Photos
  getPhotosByWaypointId(waypointId: string): Promise<VisitorPhoto[]>;
  createVisitorPhoto(photo: InsertVisitorPhoto): Promise<VisitorPhoto>;
  approveVisitorPhoto(id: string): Promise<VisitorPhoto>;
  deleteVisitorPhoto(id: string): Promise<void>;

  // Campaigns
  getAllCampaigns(): Promise<Campaign[]>;
  getActiveCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;

  // Campaign Markers
  getCampaignMarkersByCampaignId(campaignId: string): Promise<CampaignMarker[]>;
  getCampaignMarkerById(id: string): Promise<CampaignMarker | undefined>;
  createCampaignMarker(marker: InsertCampaignMarker): Promise<CampaignMarker>;
  updateCampaignMarker(id: string, marker: Partial<CampaignMarker>): Promise<CampaignMarker>;
  deleteCampaignMarker(id: string): Promise<void>;

  // Routes
  getRoutesByCampaignId(campaignId: string): Promise<Route[]>;
  getRouteById(id: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: string, route: Partial<Route>): Promise<Route>;
  deleteRoute(id: string): Promise<void>;

  // Route Markers
  getMarkersByRouteId(routeId: string): Promise<RouteMarker[]>;
  getMarkersWithDetailsByRouteId(routeId: string): Promise<any[]>;
  getMarkerById(id: string): Promise<RouteMarker | undefined>;
  createRouteMarker(marker: InsertRouteMarker): Promise<RouteMarker>;
  updateRouteMarker(id: string, marker: Partial<RouteMarker>): Promise<RouteMarker>;
  deleteRouteMarker(id: string): Promise<void>;

  // Questions
  getQuestionsByMarkerId(markerId: string): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<Question>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;

  // Campaign Progress
  getCampaignProgress(userId: string, campaignId: string): Promise<CampaignProgress | undefined>;
  getCampaignProgressById(id: string): Promise<CampaignProgress | undefined>;
  getCampaignProgressByVerificationCode(code: string): Promise<CampaignProgress | undefined>;
  getUserCampaignProgresses(userId: string): Promise<CampaignProgress[]>;
  getCampaignProgressByCampaignId(campaignId: string): Promise<CampaignProgress[]>;
  createCampaignProgress(progress: InsertCampaignProgress): Promise<CampaignProgress>;
  updateCampaignProgress(id: string, progress: Partial<CampaignProgress>): Promise<CampaignProgress>;

  // Question Attempts
  getAttemptsByProgress(progressId: string): Promise<QuestionAttempt[]>;
  createQuestionAttempt(attempt: InsertQuestionAttempt): Promise<QuestionAttempt>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllTrails(): Promise<Trail[]> {
    return await db.select().from(trails).orderBy(asc(trails.name));
  }

  async getTrailById(id: string): Promise<Trail | undefined> {
    const [trail] = await db.select().from(trails).where(eq(trails.id, id));
    return trail || undefined;
  }

  async createTrail(insertTrail: InsertTrail): Promise<Trail> {
    const [trail] = await db
      .insert(trails)
      .values(insertTrail)
      .returning();
    return trail;
  }

  async getWaypointsByTrailId(trailId: string): Promise<Waypoint[]> {
    return await db
      .select()
      .from(waypoints)
      .where(and(eq(waypoints.trailId, trailId), eq(waypoints.isActive, true)))
      .orderBy(asc(waypoints.orderIndex));
  }

  async getWaypointById(id: string): Promise<Waypoint | undefined> {
    const [waypoint] = await db.select().from(waypoints).where(eq(waypoints.id, id));
    return waypoint || undefined;
  }

  async createWaypoint(insertWaypoint: InsertWaypoint): Promise<Waypoint> {
    const [waypoint] = await db
      .insert(waypoints)
      .values(insertWaypoint)
      .returning();
    return waypoint;
  }

  async updateWaypoint(id: string, updateData: Partial<Waypoint>): Promise<Waypoint> {
    const [waypoint] = await db
      .update(waypoints)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(waypoints.id, id))
      .returning();
    return waypoint;
  }

  async getUserProgress(userId: string, trailId: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.trailId, trailId)));
    return progress || undefined;
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const [progress] = await db
      .insert(userProgress)
      .values(insertProgress)
      .returning();
    return progress;
  }

  async updateUserProgress(id: string, updateData: Partial<UserProgress>): Promise<UserProgress> {
    const [progress] = await db
      .update(userProgress)
      .set({ ...updateData, lastVisitedAt: new Date() })
      .where(eq(userProgress.id, id))
      .returning();
    return progress;
  }

  async getPhotosByWaypointId(waypointId: string): Promise<VisitorPhoto[]> {
    return await db
      .select()
      .from(visitorPhotos)
      .where(and(eq(visitorPhotos.waypointId, waypointId), eq(visitorPhotos.isApproved, true)))
      .orderBy(desc(visitorPhotos.uploadedAt));
  }

  async createVisitorPhoto(insertPhoto: InsertVisitorPhoto): Promise<VisitorPhoto> {
    const [photo] = await db
      .insert(visitorPhotos)
      .values(insertPhoto)
      .returning();
    return photo;
  }

  async approveVisitorPhoto(id: string): Promise<VisitorPhoto> {
    const [photo] = await db
      .update(visitorPhotos)
      .set({ isApproved: true })
      .where(eq(visitorPhotos.id, id))
      .returning();
    return photo;
  }

  async deleteVisitorPhoto(id: string): Promise<void> {
    await db.delete(visitorPhotos).where(eq(visitorPhotos.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUserLocation(userId: string, latitude: number, longitude: number, campaignId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        currentLatitude: latitude,
        currentLongitude: longitude,
        currentCampaignId: campaignId || null,
        lastLocationUpdate: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsersWithLocation(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, "user"),
        // Only return users with recent location updates (within last 5 minutes)
        sql`${users.lastLocationUpdate} > NOW() - INTERVAL '5 minutes'`
      ));
  }

  async getUsersInCampaign(campaignId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, "user"),
        eq(users.currentCampaignId, campaignId),
        // Only return users with recent location updates (within last 5 minutes)
        sql`${users.lastLocationUpdate} > NOW() - INTERVAL '5 minutes'`
      ));
  }

  // Campaign methods
  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.isActive, true))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: string, updateData: Partial<Campaign>): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Campaign Marker methods
  async getCampaignMarkersByCampaignId(campaignId: string): Promise<CampaignMarker[]> {
    return await db
      .select()
      .from(campaignMarkers)
      .where(eq(campaignMarkers.campaignId, campaignId));
  }

  async getCampaignMarkerById(id: string): Promise<CampaignMarker | undefined> {
    const [marker] = await db
      .select()
      .from(campaignMarkers)
      .where(eq(campaignMarkers.id, id));
    return marker || undefined;
  }

  async createCampaignMarker(insertMarker: InsertCampaignMarker): Promise<CampaignMarker> {
    const [marker] = await db
      .insert(campaignMarkers)
      .values(insertMarker)
      .returning();
    return marker;
  }

  async updateCampaignMarker(id: string, updateMarker: Partial<CampaignMarker>): Promise<CampaignMarker> {
    const [marker] = await db
      .update(campaignMarkers)
      .set({ ...updateMarker, updatedAt: new Date() })
      .where(eq(campaignMarkers.id, id))
      .returning();
    return marker;
  }

  async deleteCampaignMarker(id: string): Promise<void> {
    await db.delete(campaignMarkers).where(eq(campaignMarkers.id, id));
  }

  // Route methods
  async getRoutesByCampaignId(campaignId: string): Promise<Route[]> {
    return await db
      .select()
      .from(routes)
      .where(eq(routes.campaignId, campaignId))
      .orderBy(asc(routes.orderIndex));
  }

  async getRouteById(id: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(insertRoute)
      .returning();
    return route;
  }

  async updateRoute(id: string, updateData: Partial<Route>): Promise<Route> {
    const [route] = await db
      .update(routes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(routes.id, id))
      .returning();
    return route;
  }

  async deleteRoute(id: string): Promise<void> {
    await db.delete(routes).where(eq(routes.id, id));
  }

  // Route Marker methods
  async getMarkersByRouteId(routeId: string): Promise<RouteMarker[]> {
    return await db
      .select()
      .from(routeMarkers)
      .where(eq(routeMarkers.routeId, routeId))
      .orderBy(asc(routeMarkers.orderIndex));
  }

  // Get markers with full waypoint or campaign marker data
  async getMarkersWithDetailsByRouteId(routeId: string): Promise<any[]> {
    const markers = await db
      .select()
      .from(routeMarkers)
      .where(eq(routeMarkers.routeId, routeId))
      .orderBy(asc(routeMarkers.orderIndex));

    const markersWithDetails = await Promise.all(
      markers.map(async (marker) => {
        let locationData = null;

        if (marker.waypointId) {
          const [waypoint] = await db
            .select()
            .from(waypoints)
            .where(eq(waypoints.id, marker.waypointId));
          locationData = waypoint;
        } else if (marker.campaignMarkerId) {
          const [campaignMarker] = await db
            .select()
            .from(campaignMarkers)
            .where(eq(campaignMarkers.id, marker.campaignMarkerId));
          locationData = campaignMarker;
        }

        return {
          ...marker,
          waypoint: marker.waypointId ? locationData : null,
          campaignMarker: marker.campaignMarkerId ? locationData : null,
        };
      })
    );

    return markersWithDetails;
  }

  async getMarkerById(id: string): Promise<RouteMarker | undefined> {
    const [marker] = await db.select().from(routeMarkers).where(eq(routeMarkers.id, id));
    return marker || undefined;
  }

  async createRouteMarker(insertMarker: InsertRouteMarker): Promise<RouteMarker> {
    const [marker] = await db
      .insert(routeMarkers)
      .values(insertMarker)
      .returning();
    return marker;
  }

  async updateRouteMarker(id: string, updateData: Partial<RouteMarker>): Promise<RouteMarker> {
    const [marker] = await db
      .update(routeMarkers)
      .set(updateData)
      .where(eq(routeMarkers.id, id))
      .returning();
    return marker;
  }

  async deleteRouteMarker(id: string): Promise<void> {
    await db.delete(routeMarkers).where(eq(routeMarkers.id, id));
  }

  // Question methods
  async getQuestionsByMarkerId(markerId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.routeMarkerId, markerId))
      .orderBy(asc(questions.orderIndex));
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async updateQuestion(id: string, updateData: Partial<Question>): Promise<Question> {
    const [question] = await db
      .update(questions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Campaign Progress methods
  async getCampaignProgress(userId: string, campaignId: string): Promise<CampaignProgress | undefined> {
    const [progress] = await db
      .select()
      .from(campaignProgress)
      .where(and(eq(campaignProgress.userId, userId), eq(campaignProgress.campaignId, campaignId)));
    return progress || undefined;
  }

  async getCampaignProgressById(id: string): Promise<CampaignProgress | undefined> {
    const [progress] = await db
      .select()
      .from(campaignProgress)
      .where(eq(campaignProgress.id, id));
    return progress || undefined;
  }

  async getCampaignProgressByVerificationCode(code: string): Promise<CampaignProgress | undefined> {
    const [progress] = await db
      .select()
      .from(campaignProgress)
      .where(eq(campaignProgress.verificationCode, code));
    return progress || undefined;
  }

  async getUserCampaignProgresses(userId: string): Promise<CampaignProgress[]> {
    return await db
      .select()
      .from(campaignProgress)
      .where(eq(campaignProgress.userId, userId))
      .orderBy(desc(campaignProgress.lastActivityAt));
  }

  async getCampaignProgressByCampaignId(campaignId: string): Promise<CampaignProgress[]> {
    return await db
      .select()
      .from(campaignProgress)
      .where(eq(campaignProgress.campaignId, campaignId))
      .orderBy(desc(campaignProgress.lastActivityAt));
  }

  async createCampaignProgress(insertProgress: InsertCampaignProgress): Promise<CampaignProgress> {
    const [progress] = await db
      .insert(campaignProgress)
      .values(insertProgress)
      .returning();
    return progress;
  }

  async updateCampaignProgress(id: string, updateData: Partial<CampaignProgress>): Promise<CampaignProgress> {
    const [progress] = await db
      .update(campaignProgress)
      .set({ ...updateData, lastActivityAt: new Date() })
      .where(eq(campaignProgress.id, id))
      .returning();
    return progress;
  }

  // Question Attempt methods
  async getAttemptsByProgress(progressId: string): Promise<QuestionAttempt[]> {
    return await db
      .select()
      .from(questionAttempts)
      .where(eq(questionAttempts.campaignProgressId, progressId))
      .orderBy(desc(questionAttempts.attemptedAt));
  }

  async createQuestionAttempt(insertAttempt: InsertQuestionAttempt): Promise<QuestionAttempt> {
    const [attempt] = await db
      .insert(questionAttempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }
}

export const storage = new DatabaseStorage();
