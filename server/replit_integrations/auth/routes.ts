import type { Express } from "express";
import { authStorage } from "./storage";
import { getAuthUser, isPasswordAuthEnabled, isReplitAuthEnabled } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user - supports both auth methods
  app.get("/api/auth/user", async (req: any, res) => {
    // Check password-based auth
    if (isPasswordAuthEnabled() && req.session?.adminAuthenticated) {
      return res.json(req.session.adminUser);
    }

    // Check Replit Auth
    if (isReplitAuthEnabled() && req.isAuthenticated && req.isAuthenticated()) {
      try {
        const userId = req.user.claims.sub;
        const user = await authStorage.getUser(userId);
        return res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ message: "Failed to fetch user" });
      }
    }

    return res.status(401).json({ message: "Not authenticated" });
  });
}
