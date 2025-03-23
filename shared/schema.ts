import { pgTable, text, serial, integer, boolean, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
});

// Vehicle model
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  licensePlate: text("license_plate").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  nickname: text("nickname"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  userId: true,
  licensePlate: true,
  vehicleType: true,
  nickname: true,
});

// Parking Locations
export const parkingLocations = pgTable("parking_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  totalSpots: integer("total_spots").notNull(),
  hourlyRate: real("hourly_rate").notNull(),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  hasMetroAccess: boolean("has_metro_access").default(true),
});

export const insertParkingLocationSchema = createInsertSchema(parkingLocations).omit({
  id: true,
});

// Parking Spots
export const parkingSpots = pgTable("parking_spots", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  spotNumber: text("spot_number").notNull(),
  level: text("level"),
  section: text("section"),
  isAvailable: boolean("is_available").default(true),
  spotType: text("spot_type").default("standard"),
});

export const insertParkingSpotSchema = createInsertSchema(parkingSpots).omit({
  id: true,
});

// Parking Bookings
export const parkingBookings = pgTable("parking_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  spotId: integer("spot_id").notNull(),
  locationId: integer("location_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, canceled, completed
  bookingCode: text("booking_code").notNull(),
  totalAmount: real("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isFavorite: boolean("is_favorite").default(false),
});

export const insertParkingBookingSchema = createInsertSchema(parkingBookings).omit({
  id: true,
  createdAt: true,
});

// Transportation Types
export const transportationTypes = pgTable("transportation_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  baseRate: real("base_rate").notNull(),
  perKmRate: real("per_km_rate").notNull(),
});

export const insertTransportationTypeSchema = createInsertSchema(transportationTypes).omit({
  id: true,
});

// Transportation Bookings
export const transportationBookings = pgTable("transportation_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transportTypeId: integer("transport_type_id").notNull(),
  parkingBookingId: integer("parking_booking_id"),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  pickupTime: timestamp("pickup_time").notNull(),
  isShared: boolean("is_shared").default(false),
  status: text("status").notNull().default("pending"), // pending, confirmed, in_progress, completed, canceled
  amount: real("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransportationBookingSchema = createInsertSchema(transportationBookings).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type ParkingLocation = typeof parkingLocations.$inferSelect;
export type InsertParkingLocation = z.infer<typeof insertParkingLocationSchema>;

export type ParkingSpot = typeof parkingSpots.$inferSelect;
export type InsertParkingSpot = z.infer<typeof insertParkingSpotSchema>;

export type ParkingBooking = typeof parkingBookings.$inferSelect;
export type InsertParkingBooking = z.infer<typeof insertParkingBookingSchema>;

export type TransportationType = typeof transportationTypes.$inferSelect;
export type InsertTransportationType = z.infer<typeof insertTransportationTypeSchema>;

export type TransportationBooking = typeof transportationBookings.$inferSelect;
export type InsertTransportationBooking = z.infer<typeof insertTransportationBookingSchema>;
