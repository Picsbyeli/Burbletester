import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;   // User ID from database
    passport?: any;    // Passport.js session data
  }
}