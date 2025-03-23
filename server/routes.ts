import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleSchema, insertParkingLocationSchema, insertParkingSpotSchema, insertParkingBookingSchema, insertTransportationTypeSchema, insertTransportationBookingSchema, User } from "../shared/schema";
import crypto from "crypto";
import { z } from "zod";

// Extend Express Request type to include session and user
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

declare module 'express' {
  interface Request {
    user?: User;
  }
}

// Helper function to generate a unique code
const generateBookingCode = () => {
  return `PARK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // In a real app, we'd hash the password
      const newUser = await storage.createUser(userData);
      
      // Omit password from response
      const { password, ...userWithoutPassword } = newUser;
      
      req.session.userId = newUser.id;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Omit password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Omit password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Authentication middleware
  const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
  };

  // Vehicle routes
  app.get("/api/vehicles", authMiddleware, async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesByUserId(req.user.id);
      res.status(200).json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.post("/api/vehicles", authMiddleware, async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newVehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(newVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Parking locations routes
  app.get("/api/parking/locations", async (req, res) => {
    try {
      const locations = await storage.getParkingLocations();
      res.status(200).json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking locations" });
    }
  });

  app.get("/api/parking/locations/:id", async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const location = await storage.getParkingLocationById(locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Parking location not found" });
      }
      
      res.status(200).json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking location" });
    }
  });

  // Parking spots routes
  app.get("/api/parking/spots", async (req, res) => {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
      
      const spots = locationId 
        ? await storage.getParkingSpotsByLocationId(locationId)
        : await storage.getParkingSpots();
      
      res.status(200).json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking spots" });
    }
  });

  app.get("/api/parking/spots/:id", async (req, res) => {
    try {
      const spotId = parseInt(req.params.id);
      const spot = await storage.getParkingSpotById(spotId);
      
      if (!spot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }
      
      res.status(200).json(spot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking spot" });
    }
  });

  // Booking routes
  app.get("/api/bookings", authMiddleware, async (req, res) => {
    try {
      const bookings = await storage.getParkingBookingsByUserId(req.user.id);
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", authMiddleware, async (req, res) => {
    try {
      const { locationId, vehicleId, startTime, endTime } = req.body;
      
      // Find an available spot at the location
      const availableSpots = await storage.getAvailableParkingSpots(
        locationId,
        new Date(startTime),
        new Date(endTime)
      );
      
      if (availableSpots.length === 0) {
        return res.status(400).json({ message: "No available parking spots for the selected time" });
      }
      
      // Get location for pricing info
      const location = await storage.getParkingLocationById(locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Parking location not found" });
      }
      
      // Calculate total amount (hours * hourly rate + booking fee)
      const hours = Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60));
      const totalAmount = (hours * location.hourlyRate) + 1.5; // $1.5 booking fee
      
      // Generate booking code
      const bookingCode = generateBookingCode();
      
      // Create booking
      const bookingData = insertParkingBookingSchema.parse({
        userId: req.user.id,
        vehicleId,
        spotId: availableSpots[0].id,
        locationId,
        startTime,
        endTime,
        status: "confirmed",
        bookingCode,
        totalAmount
      });
      
      const newBooking = await storage.createParkingBooking(bookingData);
      
      // Update spot availability
      await storage.updateParkingSpotAvailability(availableSpots[0].id, false);
      
      res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", authMiddleware, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getParkingBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this booking" });
      }
      
      // Update booking
      const updatedBooking = await storage.updateParkingBooking(bookingId, req.body);
      res.status(200).json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", authMiddleware, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getParkingBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }
      
      // Cancel booking
      await storage.updateParkingBooking(bookingId, { status: "canceled" });
      
      // Release parking spot
      await storage.updateParkingSpotAvailability(booking.spotId, true);
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Transportation types routes
  app.get("/api/transportation/types", async (req, res) => {
    try {
      const types = await storage.getTransportationTypes();
      res.status(200).json(types);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transportation types" });
    }
  });

  // Transportation bookings routes
  app.get("/api/transportation/bookings", authMiddleware, async (req, res) => {
    try {
      const bookings = await storage.getTransportationBookingsByUserId(req.user.id);
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transportation bookings" });
    }
  });

  app.post("/api/transportation/bookings", authMiddleware, async (req, res) => {
    try {
      const bookingData = insertTransportationBookingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newBooking = await storage.createTransportationBooking(bookingData);
      res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transportation booking" });
    }
  });

  // Initialize demo data if needed
  await initializeDemoData();

  const httpServer = createServer(app);
  return httpServer;

  // Helper function to initialize demo data
  async function initializeDemoData() {
    // Check if we already have data
    const existingLocations = await storage.getParkingLocations();
    
    if (existingLocations.length > 0) {
      return; // Data already exists
    }
    
    // Create demo parking locations
    const location1 = await storage.createParkingLocation({
      name: "Central Metro Parking",
      address: "123 Main Street, City Center",
      latitude: 37.7749,
      longitude: -122.4194,
      totalSpots: 50,
      hourlyRate: 5,
      rating: 4.5,
      reviewCount: 128,
      hasMetroAccess: true
    });
    
    const location2 = await storage.createParkingLocation({
      name: "Westside Metro Parking",
      address: "456 West Avenue, Downtown",
      latitude: 37.7734,
      longitude: -122.4314,
      totalSpots: 75,
      hourlyRate: 4.5,
      rating: 4.2,
      reviewCount: 95,
      hasMetroAccess: true
    });
    
    const location3 = await storage.createParkingLocation({
      name: "Eastside Metro Parking",
      address: "789 East Boulevard, City East",
      latitude: 37.7854,
      longitude: -122.4054,
      totalSpots: 40,
      hourlyRate: 6,
      rating: 4.7,
      reviewCount: 112,
      hasMetroAccess: true
    });
    
    // Create parking spots for each location
    for (let i = 1; i <= 10; i++) {
      await storage.createParkingSpot({
        locationId: location1.id,
        spotNumber: `A${i}`,
        level: "1",
        section: "A",
        isAvailable: true,
        spotType: "standard"
      });
    }
    
    for (let i = 1; i <= 15; i++) {
      await storage.createParkingSpot({
        locationId: location2.id,
        spotNumber: `B${i}`,
        level: "2",
        section: "B",
        isAvailable: true,
        spotType: "standard"
      });
    }
    
    for (let i = 1; i <= 8; i++) {
      await storage.createParkingSpot({
        locationId: location3.id,
        spotNumber: `C${i}`,
        level: "1",
        section: "C",
        isAvailable: true,
        spotType: "standard"
      });
    }
    
    // Create transportation types
    await storage.createTransportationType({
      name: "Cab",
      icon: "car-side",
      baseRate: 8,
      perKmRate: 2
    });
    
    await storage.createTransportationType({
      name: "Shuttle",
      icon: "shuttle-van",
      baseRate: 4,
      perKmRate: 1
    });
    
    await storage.createTransportationType({
      name: "E-Rickshaw",
      icon: "bicycle",
      baseRate: 3,
      perKmRate: 1
    });
    
    // Create a demo user
    const demoUser = await storage.createUser({
      username: "john.doe",
      password: "password123",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "555-123-4567"
    });
    
    // Create a vehicle for the demo user
    const demoVehicle = await storage.createVehicle({
      userId: demoUser.id,
      licensePlate: "ABC-1234",
      vehicleType: "Sedan",
      nickname: "My Sedan"
    });
    
    // Create a demo booking
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0); // 4:00 PM today
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0); // 7:00 PM today
    
    await storage.createParkingBooking({
      userId: demoUser.id,
      vehicleId: demoVehicle.id,
      spotId: 2, // B2 spot
      locationId: location2.id,
      startTime,
      endTime,
      status: "confirmed",
      bookingCode: "PARK-123ABC",
      totalAmount: 13.5 // $4.5/hr * 3 hours + $1.5 booking fee
    });
    
    // Update spot availability
    await storage.updateParkingSpotAvailability(2, false);
  }
}
