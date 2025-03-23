import {
  users, User, InsertUser,
  vehicles, Vehicle, InsertVehicle,
  parkingLocations, ParkingLocation, InsertParkingLocation,
  parkingSpots, ParkingSpot, InsertParkingSpot,
  parkingBookings, ParkingBooking, InsertParkingBooking,
  transportationTypes, TransportationType, InsertTransportationType,
  transportationBookings, TransportationBooking, InsertTransportationBooking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vehicles
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByUserId(userId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;

  // Parking Locations
  getParkingLocations(): Promise<ParkingLocation[]>;
  getParkingLocationById(id: number): Promise<ParkingLocation | undefined>;
  createParkingLocation(location: InsertParkingLocation): Promise<ParkingLocation>;
  updateParkingLocation(id: number, location: Partial<ParkingLocation>): Promise<ParkingLocation>;

  // Parking Spots
  getParkingSpots(): Promise<ParkingSpot[]>;
  getParkingSpotById(id: number): Promise<ParkingSpot | undefined>;
  getParkingSpotsByLocationId(locationId: number): Promise<ParkingSpot[]>;
  getAvailableParkingSpots(locationId: number, startTime: Date, endTime: Date): Promise<ParkingSpot[]>;
  createParkingSpot(spot: InsertParkingSpot): Promise<ParkingSpot>;
  updateParkingSpotAvailability(id: number, isAvailable: boolean): Promise<ParkingSpot>;

  // Parking Bookings
  getParkingBookings(): Promise<ParkingBooking[]>;
  getParkingBookingById(id: number): Promise<ParkingBooking | undefined>;
  getParkingBookingsByUserId(userId: number): Promise<ParkingBooking[]>;
  createParkingBooking(booking: InsertParkingBooking): Promise<ParkingBooking>;
  updateParkingBooking(id: number, booking: Partial<ParkingBooking>): Promise<ParkingBooking>;

  // Transportation Types
  getTransportationTypes(): Promise<TransportationType[]>;
  getTransportationTypeById(id: number): Promise<TransportationType | undefined>;
  createTransportationType(type: InsertTransportationType): Promise<TransportationType>;

  // Transportation Bookings
  getTransportationBookings(): Promise<TransportationBooking[]>;
  getTransportationBookingById(id: number): Promise<TransportationBooking | undefined>;
  getTransportationBookingsByUserId(userId: number): Promise<TransportationBooking[]>;
  createTransportationBooking(booking: InsertTransportationBooking): Promise<TransportationBooking>;
  updateTransportationBooking(id: number, booking: Partial<TransportationBooking>): Promise<TransportationBooking>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private parkingLocations: Map<number, ParkingLocation>;
  private parkingSpots: Map<number, ParkingSpot>;
  private parkingBookings: Map<number, ParkingBooking>;
  private transportationTypes: Map<number, TransportationType>;
  private transportationBookings: Map<number, TransportationBooking>;

  private currentUserIds: number;
  private currentVehicleIds: number;
  private currentLocationIds: number;
  private currentSpotIds: number;
  private currentBookingIds: number;
  private currentTransportTypeIds: number;
  private currentTransportBookingIds: number;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.parkingLocations = new Map();
    this.parkingSpots = new Map();
    this.parkingBookings = new Map();
    this.transportationTypes = new Map();
    this.transportationBookings = new Map();

    this.currentUserIds = 1;
    this.currentVehicleIds = 1;
    this.currentLocationIds = 1;
    this.currentSpotIds = 1;
    this.currentBookingIds = 1;
    this.currentTransportTypeIds = 1;
    this.currentTransportBookingIds = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserIds++;
    // Make sure optional fields are properly handled
    const user: User = { 
      ...insertUser, 
      id,
      phone: insertUser.phone || null 
    };
    this.users.set(id, user);
    return user;
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      (vehicle) => vehicle.userId === userId
    );
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleIds++;
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      nickname: insertVehicle.nickname || null
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<Vehicle>): Promise<Vehicle> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) {
      throw new Error(`Vehicle with id ${id} not found`);
    }
    const updatedVehicle = { ...existingVehicle, ...vehicleUpdate };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    if (!this.vehicles.has(id)) {
      throw new Error(`Vehicle with id ${id} not found`);
    }
    this.vehicles.delete(id);
  }

  // Parking Location methods
  async getParkingLocations(): Promise<ParkingLocation[]> {
    return Array.from(this.parkingLocations.values());
  }

  async getParkingLocationById(id: number): Promise<ParkingLocation | undefined> {
    return this.parkingLocations.get(id);
  }

  async createParkingLocation(insertLocation: InsertParkingLocation): Promise<ParkingLocation> {
    const id = this.currentLocationIds++;
    const location: ParkingLocation = { 
      ...insertLocation, 
      id,
      rating: insertLocation.rating || null,
      reviewCount: insertLocation.reviewCount || null,
      hasMetroAccess: insertLocation.hasMetroAccess || null
    };
    this.parkingLocations.set(id, location);
    return location;
  }

  async updateParkingLocation(id: number, locationUpdate: Partial<ParkingLocation>): Promise<ParkingLocation> {
    const existingLocation = this.parkingLocations.get(id);
    if (!existingLocation) {
      throw new Error(`Parking location with id ${id} not found`);
    }
    const updatedLocation = { ...existingLocation, ...locationUpdate };
    this.parkingLocations.set(id, updatedLocation);
    return updatedLocation;
  }

  // Parking Spot methods
  async getParkingSpots(): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values());
  }

  async getParkingSpotById(id: number): Promise<ParkingSpot | undefined> {
    return this.parkingSpots.get(id);
  }

  async getParkingSpotsByLocationId(locationId: number): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values()).filter(
      (spot) => spot.locationId === locationId
    );
  }

  async getAvailableParkingSpots(locationId: number, startTime: Date, endTime: Date): Promise<ParkingSpot[]> {
    // Get all spots at the location
    const locationSpots = await this.getParkingSpotsByLocationId(locationId);
    
    // Filter out spots that are not available
    const availableSpots = locationSpots.filter(spot => spot.isAvailable);
    
    // Check bookings to see if any spots are reserved during the requested time
    const bookings = Array.from(this.parkingBookings.values()).filter(booking => 
      booking.locationId === locationId && 
      booking.status !== 'canceled' && 
      booking.status !== 'completed'
    );
    
    // Filter out spots that have bookings overlapping with the requested time
    return availableSpots.filter(spot => {
      const hasOverlappingBooking = bookings.some(booking => 
        booking.spotId === spot.id &&
        (
          (new Date(booking.startTime) <= endTime && new Date(booking.endTime) >= startTime) // Booking overlaps with requested time
        )
      );
      
      return !hasOverlappingBooking;
    });
  }

  async createParkingSpot(insertSpot: InsertParkingSpot): Promise<ParkingSpot> {
    const id = this.currentSpotIds++;
    const spot: ParkingSpot = { 
      ...insertSpot, 
      id,
      level: insertSpot.level || null,
      section: insertSpot.section || null,
      isAvailable: insertSpot.isAvailable ?? null,
      spotType: insertSpot.spotType || null
    };
    this.parkingSpots.set(id, spot);
    return spot;
  }

  async updateParkingSpotAvailability(id: number, isAvailable: boolean): Promise<ParkingSpot> {
    const existingSpot = this.parkingSpots.get(id);
    if (!existingSpot) {
      throw new Error(`Parking spot with id ${id} not found`);
    }
    const updatedSpot = { ...existingSpot, isAvailable };
    this.parkingSpots.set(id, updatedSpot);
    return updatedSpot;
  }

  // Parking Booking methods
  async getParkingBookings(): Promise<ParkingBooking[]> {
    return Array.from(this.parkingBookings.values());
  }

  async getParkingBookingById(id: number): Promise<ParkingBooking | undefined> {
    return this.parkingBookings.get(id);
  }

  async getParkingBookingsByUserId(userId: number): Promise<ParkingBooking[]> {
    return Array.from(this.parkingBookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async createParkingBooking(insertBooking: InsertParkingBooking): Promise<ParkingBooking> {
    const id = this.currentBookingIds++;
    const booking: ParkingBooking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      status: insertBooking.status || "pending", // Default status
      isFavorite: insertBooking.isFavorite || null
    };
    this.parkingBookings.set(id, booking);
    return booking;
  }

  async updateParkingBooking(id: number, bookingUpdate: Partial<ParkingBooking>): Promise<ParkingBooking> {
    const existingBooking = this.parkingBookings.get(id);
    if (!existingBooking) {
      throw new Error(`Parking booking with id ${id} not found`);
    }
    const updatedBooking = { ...existingBooking, ...bookingUpdate };
    this.parkingBookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Transportation Type methods
  async getTransportationTypes(): Promise<TransportationType[]> {
    return Array.from(this.transportationTypes.values());
  }

  async getTransportationTypeById(id: number): Promise<TransportationType | undefined> {
    return this.transportationTypes.get(id);
  }

  async createTransportationType(insertType: InsertTransportationType): Promise<TransportationType> {
    const id = this.currentTransportTypeIds++;
    const type: TransportationType = { ...insertType, id };
    this.transportationTypes.set(id, type);
    return type;
  }

  // Transportation Booking methods
  async getTransportationBookings(): Promise<TransportationBooking[]> {
    return Array.from(this.transportationBookings.values());
  }

  async getTransportationBookingById(id: number): Promise<TransportationBooking | undefined> {
    return this.transportationBookings.get(id);
  }

  async getTransportationBookingsByUserId(userId: number): Promise<TransportationBooking[]> {
    return Array.from(this.transportationBookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async createTransportationBooking(insertBooking: InsertTransportationBooking): Promise<TransportationBooking> {
    const id = this.currentTransportBookingIds++;
    const booking: TransportationBooking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      status: insertBooking.status || "pending", // Default status
      parkingBookingId: insertBooking.parkingBookingId || null,
      isShared: insertBooking.isShared || null
    };
    this.transportationBookings.set(id, booking);
    return booking;
  }

  async updateTransportationBooking(id: number, bookingUpdate: Partial<TransportationBooking>): Promise<TransportationBooking> {
    const existingBooking = this.transportationBookings.get(id);
    if (!existingBooking) {
      throw new Error(`Transportation booking with id ${id} not found`);
    }
    const updatedBooking = { ...existingBooking, ...bookingUpdate };
    this.transportationBookings.set(id, updatedBooking);
    return updatedBooking;
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.userId, userId));
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<Vehicle>): Promise<Vehicle> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicleUpdate)
      .where(eq(vehicles.id, id))
      .returning();
      
    if (!updatedVehicle) {
      throw new Error(`Vehicle with id ${id} not found`);
    }
    
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  // Parking Location methods
  async getParkingLocations(): Promise<ParkingLocation[]> {
    return await db.select().from(parkingLocations);
  }

  async getParkingLocationById(id: number): Promise<ParkingLocation | undefined> {
    const [location] = await db.select().from(parkingLocations).where(eq(parkingLocations.id, id));
    return location || undefined;
  }

  async createParkingLocation(insertLocation: InsertParkingLocation): Promise<ParkingLocation> {
    const [location] = await db.insert(parkingLocations).values(insertLocation).returning();
    return location;
  }

  async updateParkingLocation(id: number, locationUpdate: Partial<ParkingLocation>): Promise<ParkingLocation> {
    const [updatedLocation] = await db
      .update(parkingLocations)
      .set(locationUpdate)
      .where(eq(parkingLocations.id, id))
      .returning();
      
    if (!updatedLocation) {
      throw new Error(`Parking location with id ${id} not found`);
    }
    
    return updatedLocation;
  }

  // Parking Spot methods
  async getParkingSpots(): Promise<ParkingSpot[]> {
    return await db.select().from(parkingSpots);
  }

  async getParkingSpotById(id: number): Promise<ParkingSpot | undefined> {
    const [spot] = await db.select().from(parkingSpots).where(eq(parkingSpots.id, id));
    return spot || undefined;
  }

  async getParkingSpotsByLocationId(locationId: number): Promise<ParkingSpot[]> {
    return await db.select().from(parkingSpots).where(eq(parkingSpots.locationId, locationId));
  }

  async getAvailableParkingSpots(locationId: number, startTime: Date, endTime: Date): Promise<ParkingSpot[]> {
    // Get all spots for the location
    const spots = await this.getParkingSpotsByLocationId(locationId);
    
    // Filter for available spots
    const availableSpots = spots.filter(spot => spot.isAvailable);
    
    // Get all active bookings that overlap with requested time
    const overlappingBookings = await db
      .select()
      .from(parkingBookings)
      .where(
        and(
          eq(parkingBookings.locationId, locationId),
          or(
            eq(parkingBookings.status, 'pending'),
            eq(parkingBookings.status, 'confirmed')
          ),
          gte(parkingBookings.endTime, startTime),
          lte(parkingBookings.startTime, endTime)
        )
      );
    
    // Get ids of spots that are booked during requested time
    const bookedSpotIds = new Set(overlappingBookings.map(booking => booking.spotId));
    
    // Filter out spots that are already booked
    return availableSpots.filter(spot => !bookedSpotIds.has(spot.id));
  }

  async createParkingSpot(insertSpot: InsertParkingSpot): Promise<ParkingSpot> {
    const [spot] = await db.insert(parkingSpots).values(insertSpot).returning();
    return spot;
  }

  async updateParkingSpotAvailability(id: number, isAvailable: boolean): Promise<ParkingSpot> {
    const [updatedSpot] = await db
      .update(parkingSpots)
      .set({ isAvailable })
      .where(eq(parkingSpots.id, id))
      .returning();
      
    if (!updatedSpot) {
      throw new Error(`Parking spot with id ${id} not found`);
    }
    
    return updatedSpot;
  }

  // Parking Booking methods
  async getParkingBookings(): Promise<ParkingBooking[]> {
    return await db.select().from(parkingBookings);
  }

  async getParkingBookingById(id: number): Promise<ParkingBooking | undefined> {
    const [booking] = await db.select().from(parkingBookings).where(eq(parkingBookings.id, id));
    return booking || undefined;
  }

  async getParkingBookingsByUserId(userId: number): Promise<ParkingBooking[]> {
    return await db.select().from(parkingBookings).where(eq(parkingBookings.userId, userId));
  }

  async createParkingBooking(insertBooking: InsertParkingBooking): Promise<ParkingBooking> {
    // Set default values if not provided
    const bookingWithDefaults = {
      ...insertBooking,
      status: insertBooking.status || 'pending',
      isFavorite: insertBooking.isFavorite || null,
      createdAt: new Date()
    };
    
    const [booking] = await db.insert(parkingBookings).values(bookingWithDefaults).returning();
    return booking;
  }

  async updateParkingBooking(id: number, bookingUpdate: Partial<ParkingBooking>): Promise<ParkingBooking> {
    const [updatedBooking] = await db
      .update(parkingBookings)
      .set(bookingUpdate)
      .where(eq(parkingBookings.id, id))
      .returning();
      
    if (!updatedBooking) {
      throw new Error(`Parking booking with id ${id} not found`);
    }
    
    return updatedBooking;
  }

  // Transportation Type methods
  async getTransportationTypes(): Promise<TransportationType[]> {
    return await db.select().from(transportationTypes);
  }

  async getTransportationTypeById(id: number): Promise<TransportationType | undefined> {
    const [type] = await db.select().from(transportationTypes).where(eq(transportationTypes.id, id));
    return type || undefined;
  }

  async createTransportationType(insertType: InsertTransportationType): Promise<TransportationType> {
    const [type] = await db.insert(transportationTypes).values(insertType).returning();
    return type;
  }

  // Transportation Booking methods
  async getTransportationBookings(): Promise<TransportationBooking[]> {
    return await db.select().from(transportationBookings);
  }

  async getTransportationBookingById(id: number): Promise<TransportationBooking | undefined> {
    const [booking] = await db.select().from(transportationBookings).where(eq(transportationBookings.id, id));
    return booking || undefined;
  }

  async getTransportationBookingsByUserId(userId: number): Promise<TransportationBooking[]> {
    return await db.select().from(transportationBookings).where(eq(transportationBookings.userId, userId));
  }

  async createTransportationBooking(insertBooking: InsertTransportationBooking): Promise<TransportationBooking> {
    // Set default values if not provided
    const bookingWithDefaults = {
      ...insertBooking,
      status: insertBooking.status || 'pending',
      isShared: insertBooking.isShared || null,
      parkingBookingId: insertBooking.parkingBookingId || null,
      createdAt: new Date()
    };
    
    const [booking] = await db.insert(transportationBookings).values(bookingWithDefaults).returning();
    return booking;
  }

  async updateTransportationBooking(id: number, bookingUpdate: Partial<TransportationBooking>): Promise<TransportationBooking> {
    const [updatedBooking] = await db
      .update(transportationBookings)
      .set(bookingUpdate)
      .where(eq(transportationBookings.id, id))
      .returning();
      
    if (!updatedBooking) {
      throw new Error(`Transportation booking with id ${id} not found`);
    }
    
    return updatedBooking;
  }
}

// Export a database storage instance instead of memory storage
export const storage = new DatabaseStorage();
