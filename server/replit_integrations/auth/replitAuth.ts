import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

// Check if Replit Auth is available (requires REPL_ID)
export const isReplitAuthEnabled = (): boolean => {
  return Boolean(process.env.REPL_ID);
};

// Check if password auth is available
export const isPasswordAuthEnabled = (): boolean => {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
};

// Check if any auth method is enabled
export const isAuthEnabled = (): boolean => {
  return isReplitAuthEnabled() || isPasswordAuthEnabled();
};

const getOidcConfig = memoize(
  async () => {
    if (!process.env.REPL_ID) {
      throw new Error("REPL_ID environment variable is required for Replit Auth");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  // Always set up session for both auth methods
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Check if any auth method is enabled
  if (!isAuthEnabled()) {
    console.warn("========================================");
    console.warn("  Authentication is DISABLED");
    console.warn("  Set REPL_ID for Replit Auth");
    console.warn("  Or set ADMIN_USERNAME and ADMIN_PASSWORD");
    console.warn("  Admin panel will not be accessible");
    console.warn("========================================");
    return;
  }

  // Setup password-based auth routes if enabled
  if (isPasswordAuthEnabled()) {
    console.log("========================================");
    console.log("  Password Auth is ENABLED");
    console.log("  Login at /admin/login");
    console.log("========================================");
    
    app.post("/api/admin/login", (req, res) => {
      const { username, password } = req.body;
      
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        (req.session as any).adminAuthenticated = true;
        (req.session as any).adminUser = {
          id: "admin",
          email: "admin@namosistemos.lt",
          firstName: "Admin",
          lastName: "",
        };
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Session error" });
          }
          res.json({ success: true });
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    });

    app.post("/api/admin/logout", (req, res) => {
      (req.session as any).adminAuthenticated = false;
      (req.session as any).adminUser = null;
      req.session.save(() => {
        res.json({ success: true });
      });
    });
  }

  // Setup Replit Auth if available
  if (!isReplitAuthEnabled()) {
    return;
  }

  try {
    app.use(passport.initialize());
    app.use(passport.session());

    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    // Keep track of registered strategies
    const registeredStrategies = new Set<string>();

    // Helper function to ensure strategy exists for a domain
    const ensureStrategy = (domain: string) => {
      const strategyName = `replitauth:${domain}`;
      if (!registeredStrategies.has(strategyName)) {
        const strategy = new Strategy(
          {
            name: strategyName,
            config,
            scope: "openid email profile offline_access",
            callbackURL: `https://${domain}/api/callback`,
          },
          verify
        );
        passport.use(strategy);
        registeredStrategies.add(strategyName);
      }
    };

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      ensureStrategy(req.hostname);
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      ensureStrategy(req.hostname);
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });

    console.log("Replit Auth initialized successfully");
  } catch (error) {
    console.error("========================================");
    console.error("  Failed to initialize Replit Auth:");
    console.error("  ", error instanceof Error ? error.message : error);
    console.error("  Admin panel will not be accessible");
    console.error("========================================");
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // If auth is not enabled, block all admin routes
  if (!isAuthEnabled()) {
    return res.status(503).json({ 
      message: "Authentication not available",
      detail: "Admin features are disabled in this deployment" 
    });
  }

  // Check password-based auth first
  if (isPasswordAuthEnabled() && (req.session as any).adminAuthenticated) {
    return next();
  }

  // Check Replit Auth
  if (isReplitAuthEnabled()) {
    const user = req.user as any;

    if (!req.isAuthenticated || !req.isAuthenticated() || !user?.expires_at) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  return res.status(401).json({ message: "Unauthorized" });
};

// Get current authenticated user
export const getAuthUser: RequestHandler = (req, res) => {
  // Check password-based auth
  if (isPasswordAuthEnabled() && (req.session as any).adminAuthenticated) {
    return res.json((req.session as any).adminUser);
  }

  // Check Replit Auth
  if (isReplitAuthEnabled() && req.isAuthenticated && req.isAuthenticated()) {
    const user = req.user as any;
    return res.json({
      id: user.claims?.sub,
      email: user.claims?.email,
      firstName: user.claims?.first_name,
      lastName: user.claims?.last_name,
      profileImageUrl: user.claims?.profile_image_url,
    });
  }

  return res.status(401).json({ message: "Not authenticated" });
};
