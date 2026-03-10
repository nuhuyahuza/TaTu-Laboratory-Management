import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

if (!admin.apps.length) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountStr && serviceAccountStr.trim().startsWith('{')) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      console.log(`Initializing Firebase Admin with Service Account for project: ${serviceAccount.project_id}`);
      console.log(`Service Account Email: ${serviceAccount.client_email}`);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId
      });
    } else if (projectId) {
      console.log(`Initializing Firebase Admin with Project ID ONLY: ${projectId}. This may fail if Application Default Credentials are not available.`);
      admin.initializeApp({
        projectId: projectId,
      });
    } else {
      console.warn("No Firebase Project ID or Service Account found. Firebase Admin will likely fail.");
      admin.initializeApp();
    }
    console.log("Firebase Admin initialization call completed");
  } catch (error) {
    console.error("CRITICAL: Error during Firebase Admin initialization:", error);
  }
}

// Initialize services only if app exists
if (admin.apps.length > 0) {
  db = admin.firestore();
  auth = admin.auth();
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Middleware to check if Firebase is initialized
  app.use((req, res, next) => {
    if (!db || !auth) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized. Please check your environment variables (VITE_FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT)." 
      });
    }
    next();
  });

  // API Routes
  
  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      console.log("Running health check...");
      
      // Test Firestore
      const collections = await db.listCollections();
      
      // Test Auth (try to list 0 users just to see if service is enabled)
      let authStatus = "unknown";
      try {
        await auth.listUsers(0);
        authStatus = "enabled";
      } catch (authError: any) {
        console.error("Auth service check failed:", authError.message);
        authStatus = `error: ${authError.message}`;
      }
      
      let serviceAccountEmail = "None";
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountStr && serviceAccountStr.trim().startsWith('{')) {
        const sa = JSON.parse(serviceAccountStr);
        serviceAccountEmail = sa.client_email;
      }

      res.json({ 
        status: "ok", 
        firebase: "connected", 
        firestore: "ok",
        auth: authStatus,
        collections: collections.map(c => c.id),
        projectId: admin.app().options.projectId,
        serviceAccount: serviceAccountEmail,
        databaseId: "(default)"
      });
    } catch (error: any) {
      console.error("Health check failed:", error);
      res.status(500).json({ 
        status: "error", 
        message: error.message, 
        code: error.code,
        details: error.details || "No additional details",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Check if system is initialized
  app.get("/api/check-init", async (req, res) => {
    try {
      if (!db) {
        return res.json({ initialized: false, error: "Database not connected" });
      }
      const usersSnap = await db.collection("users").where("role", "==", "admin").limit(1).get();
      res.json({ initialized: !usersSnap.empty });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Setup initial admin
  app.post("/api/setup-admin", async (req, res) => {
    try {
      console.log("Attempting to setup initial admin...");
      
      if (!db || !auth) {
        throw new Error("Firebase Admin services (db/auth) are not initialized. Check your FIREBASE_SERVICE_ACCOUNT.");
      }

      const usersSnap = await db.collection("users").limit(1).get();
      if (!usersSnap.empty) {
        console.log("System already initialized (users found)");
        return res.status(400).json({ error: "System already initialized" });
      }

      const { email, password, name } = req.body;
      console.log(`Creating user: ${email}`);
      
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      console.log(`User record created: ${userRecord.uid}`);

      await db.collection("users").doc(userRecord.uid).set({
        name,
        email,
        role: "admin",
        department: "IT Administration",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("User profile created in Firestore");

      res.json({ success: true, message: "Admin created successfully" });
    } catch (error: any) {
      console.error("Setup admin failed:", error);
      res.status(500).json({ 
        error: error.message, 
        code: error.code,
        details: error.details || "No additional details"
      });
    }
  });

  // Admin: Create User
  app.post("/api/admin/users", async (req, res) => {
    // In a real app, verify admin token here
    try {
      const { email, password, name, role, department } = req.body;
      
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });

      await db.collection("users").doc(userRecord.uid).set({
        name,
        email,
        role,
        department,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Bulk Create Users
  app.post("/api/admin/users/bulk", async (req, res) => {
    try {
      const { users } = req.body; // Array of { email, password, name, role, department }
      const results = [];

      for (const userData of users) {
        try {
          const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
          });

          await db.collection("users").doc(userRecord.uid).set({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            department: userData.department,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          results.push({ email: userData.email, success: true });
        } catch (err: any) {
          results.push({ email: userData.email, success: false, error: err.message });
        }
      }

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
