import { 
  users, trails, waypoints, userProgress, visitorPhotos,
  type User, type InsertUser, 
  type Trail, type InsertTrail,
  type Waypoint, type InsertWaypoint,
  type UserProgress, type InsertUserProgress,
  type VisitorPhoto, type InsertVisitorPhoto
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export const storage = new DatabaseStorage();
