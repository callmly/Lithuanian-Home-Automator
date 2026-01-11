import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { sendLeadEmails } from "./email";
import { leadFormSchema, insertContentBlockSchema, type SelectedOptionData } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // ========== PUBLIC ROUTES ==========

  // Plans (public)
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  // Options (public)
  app.get("/api/options", async (req, res) => {
    try {
      const groups = await storage.getOptionGroups();
      const options = await storage.getOptions();
      res.json({ groups, options });
    } catch (error) {
      console.error("Error fetching options:", error);
      res.status(500).json({ error: "Failed to fetch options" });
    }
  });

  // Features (public)
  app.get("/api/features", async (req, res) => {
    try {
      const groups = await storage.getFeatureGroups();
      const features = await storage.getFeatures();
      const planFeatures = await storage.getPlanFeatures();
      res.json({ groups, features, planFeatures });
    } catch (error) {
      console.error("Error fetching features:", error);
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  // Site content (public)
  app.get("/api/site-content", async (req, res) => {
    try {
      const content = await storage.getSiteContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching site content:", error);
      res.status(500).json({ error: "Failed to fetch site content" });
    }
  });

  // Create lead (public)
  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = leadFormSchema.parse(req.body);
      
      // Get plan
      const plan = await storage.getPlan(validatedData.planId);
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      // Get all options to calculate server-side price
      const allOptions = await storage.getOptions();
      const optionsMap = new Map(allOptions.map((o) => [o.id, o]));

      let totalPriceCents = plan.basePriceCents;
      const selectedOptionsData: SelectedOptionData[] = [];

      for (const sel of validatedData.selectedOptions) {
        const option = optionsMap.get(sel.optionId);
        if (option) {
          const optionTotal = option.unitPriceCents * sel.quantity;
          totalPriceCents += optionTotal;
          selectedOptionsData.push({
            optionId: option.id,
            label: option.labelLt,
            quantity: sel.quantity,
            unitPrice: option.unitPriceCents,
            totalPrice: optionTotal,
          });
        }
      }

      // Create lead
      const lead = await storage.createLead({
        planId: plan.id,
        planName: plan.nameLt,
        totalPriceCents,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        city: validatedData.city,
        comment: validatedData.comment || null,
        selectedOptions: selectedOptionsData,
      });

      // Send emails (don't block response)
      sendLeadEmails(lead, process.env.ADMIN_EMAIL).catch((err) => {
        console.error("Failed to send lead emails:", err);
      });

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // ========== ADMIN ROUTES (protected) ==========

  // Plans CRUD
  app.post("/api/admin/plans", isAuthenticated, async (req, res) => {
    try {
      const plan = await storage.createPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Failed to create plan" });
    }
  });

  app.patch("/api/admin/plans/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.updatePlan(id, req.body);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  app.delete("/api/admin/plans/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlan(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ error: "Failed to delete plan" });
    }
  });

  // Option Groups CRUD
  app.post("/api/admin/option-groups", isAuthenticated, async (req, res) => {
    try {
      const group = await storage.createOptionGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating option group:", error);
      res.status(500).json({ error: "Failed to create option group" });
    }
  });

  app.patch("/api/admin/option-groups/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.updateOptionGroup(id, req.body);
      if (!group) {
        return res.status(404).json({ error: "Option group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error updating option group:", error);
      res.status(500).json({ error: "Failed to update option group" });
    }
  });

  app.delete("/api/admin/option-groups/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOptionGroup(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting option group:", error);
      res.status(500).json({ error: "Failed to delete option group" });
    }
  });

  // Options CRUD
  app.post("/api/admin/options", isAuthenticated, async (req, res) => {
    try {
      const option = await storage.createOption(req.body);
      res.status(201).json(option);
    } catch (error) {
      console.error("Error creating option:", error);
      res.status(500).json({ error: "Failed to create option" });
    }
  });

  app.patch("/api/admin/options/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const option = await storage.updateOption(id, req.body);
      if (!option) {
        return res.status(404).json({ error: "Option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Error updating option:", error);
      res.status(500).json({ error: "Failed to update option" });
    }
  });

  app.delete("/api/admin/options/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOption(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting option:", error);
      res.status(500).json({ error: "Failed to delete option" });
    }
  });

  // Feature Groups CRUD
  app.post("/api/admin/feature-groups", isAuthenticated, async (req, res) => {
    try {
      const group = await storage.createFeatureGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating feature group:", error);
      res.status(500).json({ error: "Failed to create feature group" });
    }
  });

  app.patch("/api/admin/feature-groups/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.updateFeatureGroup(id, req.body);
      if (!group) {
        return res.status(404).json({ error: "Feature group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error updating feature group:", error);
      res.status(500).json({ error: "Failed to update feature group" });
    }
  });

  app.delete("/api/admin/feature-groups/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFeatureGroup(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting feature group:", error);
      res.status(500).json({ error: "Failed to delete feature group" });
    }
  });

  // Features CRUD
  app.post("/api/admin/features", isAuthenticated, async (req, res) => {
    try {
      const feature = await storage.createFeature(req.body);
      res.status(201).json(feature);
    } catch (error) {
      console.error("Error creating feature:", error);
      res.status(500).json({ error: "Failed to create feature" });
    }
  });

  app.patch("/api/admin/features/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.updateFeature(id, req.body);
      if (!feature) {
        return res.status(404).json({ error: "Feature not found" });
      }
      res.json(feature);
    } catch (error) {
      console.error("Error updating feature:", error);
      res.status(500).json({ error: "Failed to update feature" });
    }
  });

  app.delete("/api/admin/features/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFeature(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting feature:", error);
      res.status(500).json({ error: "Failed to delete feature" });
    }
  });

  // Plan Features batch update
  app.post("/api/admin/plan-features/batch", isAuthenticated, async (req, res) => {
    try {
      const { updates } = req.body as {
        updates: { featureId: number; planId: number; valueBoolean?: boolean; valueText?: string }[];
      };

      for (const update of updates) {
        await storage.upsertPlanFeature({
          featureId: update.featureId,
          planId: update.planId,
          valueBoolean: update.valueBoolean ?? null,
          valueText: update.valueText ?? null,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating plan features:", error);
      res.status(500).json({ error: "Failed to update plan features" });
    }
  });

  // Site content update
  app.put("/api/admin/site-content/:key", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.upsertSiteContent(req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating site content:", error);
      res.status(500).json({ error: "Failed to update site content" });
    }
  });

  // Leads (admin)
  app.get("/api/admin/leads", isAuthenticated, async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json({ leads, total: leads.length });
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/admin/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  // ========== CONTENT BLOCKS ==========
  
  // Public route - get active blocks only
  app.get("/api/content-blocks", async (req, res) => {
    try {
      const blocks = await storage.getActiveContentBlocks();
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching content blocks:", error);
      res.status(500).json({ error: "Failed to fetch content blocks" });
    }
  });

  // Admin routes
  app.get("/api/admin/content-blocks", isAuthenticated, async (req, res) => {
    try {
      const blocks = await storage.getContentBlocks();
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching content blocks:", error);
      res.status(500).json({ error: "Failed to fetch content blocks" });
    }
  });

  app.post("/api/admin/content-blocks", isAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const parsed = insertContentBlockSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      }
      
      // Check if max blocks reached (10 blocks limit)
      const existing = await storage.getContentBlocks();
      if (existing.length >= 10) {
        return res.status(400).json({ error: "Maximum 10 content blocks allowed" });
      }
      const block = await storage.createContentBlock(parsed.data);
      res.status(201).json(block);
    } catch (error) {
      console.error("Error creating content block:", error);
      res.status(500).json({ error: "Failed to create content block" });
    }
  });

  app.patch("/api/admin/content-blocks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate request body (partial schema for updates)
      const parsed = insertContentBlockSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      }
      
      const block = await storage.updateContentBlock(id, parsed.data);
      if (!block) {
        return res.status(404).json({ error: "Content block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error updating content block:", error);
      res.status(500).json({ error: "Failed to update content block" });
    }
  });

  app.delete("/api/admin/content-blocks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContentBlock(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content block:", error);
      res.status(500).json({ error: "Failed to delete content block" });
    }
  });

  return httpServer;
}
